package com.mimo.pet;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

public class MainActivity extends Activity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);

        webView.addJavascriptInterface(new Bridge(), "Android");
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    /* ===== 给 JS 用的原生桥：发 GET 请求（绕过跨域）、存取设置 ===== */
    public class Bridge {

        @JavascriptInterface
        public String httpGet(String urlStr, String headersJson) {
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                JSONObject headers = new JSONObject(headersJson);
                Iterator<String> it = headers.keys();
                while (it.hasNext()) {
                    String k = it.next();
                    conn.setRequestProperty(k, headers.getString(k));
                }

                int code = conn.getResponseCode();
                InputStream is = code < 400 ? conn.getInputStream() : conn.getErrorStream();
                BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                br.close();

                JSONObject out = new JSONObject();
                out.put("ok", code < 400);
                out.put("status", code);
                out.put("text", sb.toString());
                return out.toString();
            } catch (Exception e) {
                try {
                    JSONObject out = new JSONObject();
                    out.put("ok", false);
                    out.put("status", 0);
                    out.put("text", String.valueOf(e.getMessage()));
                    return out.toString();
                } catch (Exception ignored) { return "{}"; }
            }
        }

        @JavascriptInterface
        public void saveSettings(String json) {
            getSharedPreferences("mimo_pet", MODE_PRIVATE)
                    .edit().putString("settings", json).apply();
        }

        @JavascriptInterface
        public String loadSettings() {
            return getSharedPreferences("mimo_pet", MODE_PRIVATE)
                    .getString("settings", "{}");
        }
    }
}
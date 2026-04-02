import React, { useState, useEffect } from "react";
import { HOST } from "../index";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ai.biffle";

const FBRedirect: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState<string>(PLAY_STORE_URL);

  useEffect(() => {
    // Read fbclid from query params on first render
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");

    console.log("[FBRedirect] fbclid:", fbclid);
    console.log("[FBRedirect] Full URL:", window.location.href);

    // If no fbclid, use Play Store fallback
    if (!fbclid) {
      console.log("[FBRedirect] No fbclid found, using Play Store fallback");
      setRedirectUrl(PLAY_STORE_URL);
      setIsLoading(false);
      return;
    }

    // Call backend API with fbclid
    const apiUrl = `${HOST}/api/v1/attribution/redirect/fb_redirect/?fbclid=${encodeURIComponent(fbclid)}`;
    console.log("[FBRedirect] Calling API:", apiUrl);

    fetch(apiUrl, {
      headers: {
        "X-Organisation-ID": "ZINTEL1234",
      },
    })
      .then((response) => {
        console.log("[FBRedirect] API response status:", response.status);
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("[FBRedirect] API response data:", data);

        const url = data?.data?.redirect_url;
        if (url) {
          console.log("[FBRedirect] Redirect URL from API:", url);
          setRedirectUrl(url);
        } else {
          console.log(
            "[FBRedirect] No redirect_url in response, using Play Store fallback",
          );
          setRedirectUrl(PLAY_STORE_URL);
        }
      })
      .catch((error) => {
        console.error("[FBRedirect] API error:", error);
        console.log("[FBRedirect] Using Play Store fallback due to error");
        setRedirectUrl(PLAY_STORE_URL);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleContinue = () => {
    console.log(
      "[FBRedirect] User clicked Continue, redirecting to:",
      redirectUrl,
    );
    window.location.href = redirectUrl;
  };

  return (
    <div
      onClick={!isLoading ? handleContinue : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#fff",
        padding: "20px",
        cursor: !isLoading ? "pointer" : "default",
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Logo */}
      <img
        src="/biffle_logo_new.png"
        alt="Biffle"
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "24px",
          marginBottom: "32px",
          boxShadow: "0 8px 24px rgba(124, 58, 237, 0.2)",
        }}
      />

      {isLoading ? (
        <>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #7c3aed",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "20px",
            }}
          />
          <p
            style={{
              fontSize: "18px",
              color: "#666",
              margin: 0,
            }}
          >
            Preparing your app…
          </p>
        </>
      ) : (
        <>
          <button
            onClick={handleContinue}
            style={{
              backgroundColor: "#7c3aed",
              color: "#fff",
              fontSize: "18px",
              fontWeight: 600,
              padding: "16px 48px",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#6d28d9")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#7c3aed")
            }
          >
            Continue to App
          </button>
          <p
            style={{
              fontSize: "14px",
              color: "#999",
              marginTop: "16px",
            }}
          >
            Tap anywhere to continue
          </p>
        </>
      )}
    </div>
  );
};

export default FBRedirect;

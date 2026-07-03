import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { storeFacebookClickAttribution } from "../utils/fbAttribution";
import { getOrganisationIdFromSearch } from "../utils/organisationIdFromUrl";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ai.zintle";

const FBRedirect: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState<string>(PLAY_STORE_URL);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fbclid = urlParams.get("fbclid")?.trim() ?? "";
    const organisationId = getOrganisationIdFromSearch(
      location.search,
      location.pathname,
    );

    if (!fbclid) {
      setRedirectUrl(PLAY_STORE_URL);
      setIsLoading(false);
      return;
    }

    void (async () => {
      try {
        const url = await storeFacebookClickAttribution(fbclid, organisationId);
        setRedirectUrl(url || PLAY_STORE_URL);
      } catch {
        setRedirectUrl(PLAY_STORE_URL);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [location.pathname, location.search]);

  const handleContinue = () => {
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

      <img
        src="/zintle_app_logo.png"
        alt="Zintle"
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

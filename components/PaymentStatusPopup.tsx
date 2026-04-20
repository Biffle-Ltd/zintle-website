import React from "react";

export const PaymentStatusPopup = ({
  status,
  onClose,
}: {
  status: string;
  onClose: () => void;
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "SUCCESS":
        return {
          icon: "fa-check-circle",
          iconColor: "text-green-500",
          bgColor: "bg-green-500/20",
          title: "Payment Successful!",
          message:
            "Your payment has been processed successfully. Coins have been added to your wallet.",
          buttonColor: "bg-green-500 hover:bg-green-600",
        };
      case "FAILED":
        return {
          icon: "fa-times-circle",
          iconColor: "text-red-500",
          bgColor: "bg-red-500/20",
          title: "Payment Failed",
          message:
            "Your payment could not be processed. Please try again or contact support if the issue persists.",
          buttonColor: "bg-red-500 hover:bg-red-600",
        };
      case "CANCELLED":
        return {
          icon: "fa-ban",
          iconColor: "text-orange-500",
          bgColor: "bg-orange-500/20",
          title: "Payment Cancelled",
          message:
            "The payment was cancelled. You can try again when you're ready.",
          buttonColor: "bg-orange-500 hover:bg-orange-600",
        };
      case "PENDING":
        return {
          icon: "fa-clock",
          iconColor: "text-yellow-500",
          bgColor: "bg-yellow-500/20",
          title: "Payment Pending",
          message:
            "Your payment is being processed. Please wait for confirmation. We'll notify you once it's complete.",
          buttonColor: "bg-yellow-500 hover:bg-yellow-600",
        };
      case "INITIATED":
        return {
          icon: "fa-hourglass-half",
          iconColor: "text-blue-500",
          bgColor: "bg-blue-500/20",
          title: "Payment Initiated",
          message:
            "Your payment has been initiated. Please complete the payment process.",
          buttonColor: "bg-blue-500 hover:bg-blue-600",
        };
      case "UNKNOWN":
      default:
        return {
          icon: "fa-question-circle",
          iconColor: "text-gray-500",
          bgColor: "bg-gray-500/20",
          title: "Payment Status Unknown",
          message:
            "We couldn't determine the payment status. Please check your order history or contact support.",
          buttonColor: "bg-gray-500 hover:bg-gray-600",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white hover:text-red-400 transition-all z-10"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        <div className="p-8 text-center">
          <div
            className={`w-20 h-20 ${config.bgColor} ${config.iconColor} rounded-full flex items-center justify-center text-4xl mx-auto mb-6`}
          >
            <i className={`fa-solid ${config.icon}`}></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">{config.title}</h3>
          <p className="text-brand-muted mb-6 text-sm leading-relaxed">
            {config.message}
          </p>
          <button
            onClick={onClose}
            className={`${config.buttonColor} text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

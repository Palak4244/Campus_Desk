const API_URL = "http://127.0.0.1:8000/chat";

const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");
const typing = document.getElementById("typing");

const intentValue = document.getElementById("intentValue");
const confidenceValue = document.getElementById("confidenceValue");
const confidenceFill = document.getElementById("confidenceFill");

const responseStatus = document.getElementById("responseStatus");
const intentStatus = document.getElementById("intentStatus");

// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(text) {
  if (text === null || text === undefined) {
    return "";
  }

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// CLEAN PDF / RAG TEXT
// =====================================================

function cleanPdfText(text) {
  if (!text) {
    return "";
  }

  let cleaned = String(text);

  // Remove excessive dots used in PDF table of contents
  cleaned = cleaned.replace(/\.{3,}/g, " ");

  // Remove repeated spaces
  cleaned = cleaned.replace(/[ \t]+/g, " ");

  // Remove unnecessary page number patterns
  cleaned = cleaned.replace(/\bPage\s*\d+\b/gi, "");

  // Remove common PDF extraction artifacts
  cleaned = cleaned.replace(/\b\d+\.\s*$/gm, "");

  // Remove isolated numbers at beginning
  cleaned = cleaned.replace(/^\s*\.\s*\d+\.?\s*/gm, "");

  // Remove common table-of-content headings when they appear
  cleaned = cleaned.replace(/Contact and Important Links\s*/gi, "");

  cleaned = cleaned.replace(
    /CAMPUS PLACEMENT RECORD\s*/gi,
    "Campus Placement Record ",
  );

  // Remove multiple new lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

// =====================================================
// FORMAT ANSWER INTO PROPER CHATBOT FORMAT
// =====================================================

function formatBotAnswer(text) {
  if (!text) {
    return `
            <div class="answer-empty">
                I could not find a suitable answer.
            </div>
        `;
  }

  let cleaned = cleanPdfText(text);

  // Split according to new lines first
  let lines = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // If PDF extraction produces one giant paragraph,
  // split it into meaningful sentences.
  if (lines.length <= 1) {
    lines = cleaned
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map((line) => line.trim())
      .filter((line) => line.length > 10);
  }

  // Remove duplicate lines
  lines = [...new Set(lines)];

  let html = `
        <div class="formatted-answer">
            <div class="answer-heading">
                <span class="answer-heading-icon">✦</span>
                <span>AI RESPONSE</span>
            </div>
    `;

  lines.forEach((line, index) => {
    let safeLine = escapeHtml(line);

    // Detect headings
    const isHeading =
      line.length < 90 &&
      !/[.!?]$/.test(line) &&
      (/placement/i.test(line) ||
        /fee/i.test(line) ||
        /hostel/i.test(line) ||
        /attendance/i.test(line) ||
        /examination/i.test(line) ||
        /exam/i.test(line) ||
        /transport/i.test(line) ||
        /calendar/i.test(line) ||
        /course/i.test(line) ||
        /scholarship/i.test(line) ||
        /library/i.test(line));

    if (isHeading) {
      html += `
                <div class="answer-section-heading">
                    ${safeLine}
                </div>
            `;
    } else {
      html += `
                <div class="answer-point">
                    <span class="point-icon">✦</span>
                    <span>${safeLine}</span>
                </div>
            `;
    }
  });

  html += `</div>`;

  return html;
}

// =====================================================
// ADD USER MESSAGE
// =====================================================

function addUserMessage(message) {
  const wrapper = document.createElement("div");

  wrapper.className = "message user-message";

  wrapper.innerHTML = `
        <div class="message-content">
            <div class="message-label">YOU</div>
            <div class="user-bubble">
                ${escapeHtml(message)}
            </div>
        </div>
    `;

  chatMessages.appendChild(wrapper);

  scrollToBottom();
}

// =====================================================
// ADD BOT MESSAGE
// =====================================================

function addBotMessage(data) {
  const wrapper = document.createElement("div");

  wrapper.className = "message bot-message";

  let confidenceText = "";

  if (data.confidence !== null && data.confidence !== undefined) {
    const confidence = Number(data.confidence);

    confidenceText = `
            <div class="answer-meta">
                <span>
                    Confidence:
                    <strong>${Math.round(confidence * 100)}%</strong>
                </span>
            </div>
        `;
  }

  let sourceText = "";

  if (data.source) {
    sourceText = `
            <div class="answer-source">
                <span class="source-label">SOURCE</span>
                <span class="source-name">
                    ${escapeHtml(data.source)}
                </span>
            </div>
        `;
  }

  let escalationHTML = "";

  if (data.escalation === true) {
    escalationHTML = `
            <div class="escalation-box">
                <strong>Student Support</strong>
                <p>
                    This message has been flagged for student support.
                    Please consider contacting a trusted person or
                    the college support/help desk.
                </p>
            </div>
        `;
  }

  wrapper.innerHTML = `
        <div class="bot-icon">✦</div>

        <div class="message-content bot-content">

            ${formatBotAnswer(data.answer)}

            ${sourceText}

            ${confidenceText}

            ${escalationHTML}

        </div>
    `;

  chatMessages.appendChild(wrapper);

  scrollToBottom();
}

// =====================================================
// TYPING INDICATOR
// =====================================================

function showTyping() {
  if (typing) {
    typing.style.display = "flex";
  }
}

function hideTyping() {
  if (typing) {
    typing.style.display = "none";
  }
}

// =====================================================
// SCROLL CHAT TO BOTTOM
// =====================================================

function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// =====================================================
// UPDATE DASHBOARD ANALYTICS
// =====================================================

function updateAnalytics(data) {
  if (intentValue) {
    intentValue.textContent = data.intent
      ? data.intent.replace(/_/g, " ").toUpperCase()
      : "UNKNOWN";
  }

  if (intentStatus) {
    intentStatus.textContent =
      data.distress === "distress" ? "SUPPORT REQUIRED" : "NORMAL";
  }

  if (confidenceValue && confidenceFill) {
    if (data.confidence === null || data.confidence === undefined) {
      confidenceValue.textContent = "—";
      confidenceFill.style.width = "0%";
    } else {
      const confidence = Math.max(0, Math.min(1, Number(data.confidence)));

      const percentage = Math.round(confidence * 100);

      confidenceValue.textContent = percentage + "%";

      confidenceFill.style.width = percentage + "%";
    }
  }

  if (responseStatus) {
    responseStatus.textContent = data.escalation ? "ESCALATED" : "ANSWERED";
  }
}

// =====================================================
// SEND QUESTION TO BACKEND
// =====================================================

async function sendQuestion() {
  const question = input.value.trim();

  if (!question) {
    return;
  }

  // Add user message
  addUserMessage(question);

  // Clear input
  input.value = "";

  // Disable button
  sendButton.disabled = true;

  // Show typing
  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        question: question,
      }),
    });

    if (!response.ok) {
      throw new Error("Server returned " + response.status);
    }

    const data = await response.json();

    // Hide typing
    hideTyping();

    // Add bot response
    addBotMessage(data);

    // Update dashboard
    updateAnalytics(data);
  } catch (error) {
    console.error("Campus Desk Error:", error);

    hideTyping();

    const errorData = {
      answer:
        "Unable to connect to Campus Desk backend. Please make sure the FastAPI server is running on port 8000.",
      source: "System",
      confidence: null,
      intent: "connection_error",
      distress: "normal",
      escalation: false,
    };

    addBotMessage(errorData);

    if (responseStatus) {
      responseStatus.textContent = "ERROR";
    }
  } finally {
    sendButton.disabled = false;

    input.focus();
  }
}

// =====================================================
// SEND BUTTON
// =====================================================

if (sendButton) {
  sendButton.addEventListener("click", sendQuestion);
}

// =====================================================
// ENTER KEY
// =====================================================

if (input) {
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendQuestion();
    }
  });
}

// =====================================================
// QUICK QUESTION BUTTONS
// =====================================================

const quickButtons = document.querySelectorAll(
  ".quick-question, .quick-btn, [data-question]",
);

quickButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const question = button.dataset.question || button.textContent.trim();

    if (!question) {
      return;
    }

    input.value = question;

    input.focus();

    sendQuestion();
  });
});

// =====================================================
// INITIAL STATE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
  hideTyping();

  if (input) {
    input.focus();
  }

  if (responseStatus) {
    responseStatus.textContent = "READY";
  }

  if (intentStatus) {
    intentStatus.textContent = "WAITING";
  }

  if (confidenceValue) {
    confidenceValue.textContent = "—";
  }
});

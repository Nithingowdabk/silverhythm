import { State } from '../state.js';
import { API } from '../api.js';

const WA_NUMBER = '916364051237';

// Bot state
let botState = {
  step: null,         // current conversation step
  name: '',
  phone: '',
  email: '',
  queryParts: [],     // accumulate multi-message query
  product: null,      // contextual product if enquiring from product page
  size: '',
  polish: '',
  frame: '',
  comments: '',
};

export function initEnquiryBot() {
  injectWhatsAppFab();
  injectInstagramFab();
  
  // Prevent duplicate enquiry bot bubble
  if (document.getElementById('enq-bubble')) return;
  injectBubble();
  injectPanel();
  wireEvents();
}

export async function openEnquiryBotForProduct(product) {
  // Clear the messages panel to restart conversation
  const messagesContainer = document.getElementById('enq-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }

  // Set chatbot state for product customization
  botState = {
    step: 'size',
    name: '',
    phone: '',
    email: '',
    queryParts: [],
    product: product,
    size: '',
    polish: '',
    frame: '',
    comments: '',
  };

  // Pre-fill name and phone if user is logged in
  const user = State.get('user');
  if (user) {
    botState.name = user.name || '';
    botState.email = user.email || '';
    try {
      const res = await API.getProfile();
      if (res.ok && res.data && res.data.phone) {
        botState.phone = res.data.phone;
      }
    } catch (e) {}
  }

  // Open the panel
  openPanel();

  // Show welcome product messages
  botMessage(`Hi! You are enquiring about the *${product.name}* (ID: ${product.id}).`);
  
  setTimeout(() => {
    botMessage("Let's select your customization preferences.");
    setTimeout(() => {
      askSize();
    }, 600);
  }, 600);
}

function askSize() {
  const sizeOptions = [
    'Small (6x8 inches)',
    'Medium (8x10 inches)',
    'Large (10x12 inches)',
    'Extra Large (12x15 inches)',
    'Custom Size (Share pooja room details)'
  ];
  botChoicesMessage('Step 1: Choose Preferred Size', sizeOptions, 'size', 'ask_polish');
}

function askPolish() {
  const polishOptions = [
    'Gold Polish',
    'Silver Polish',
    'Antique Gold Polish',
    'Antique Silver Polish'
  ];
  botChoicesMessage('Step 2: Choose Polish', polishOptions, 'polish', 'ask_frame');
}

function askFrame() {
  const frameOptions = [
    'Rosewood Plain',
    'Rosewood Inlay',
    'Rosewood Flat',
    'Rosewood Button',
    'Silver Frame',
    'Brass Frame',
    'Fibre Frame'
  ];
  botChoicesMessage('Step 3: Choose Frame Preferred', frameOptions, 'frame', 'ask_comments');
}

function askComments() {
  botMessage("Step 4: Do you have any other custom requirements or pooja room measurements? Type them below or type *none* to proceed.");
  botState.step = 'comments';
}

function compileAndConfirmEnquiry() {
  botMessage("Here is a summary of your customization preferences:");
  
  const summaryText = `
*Product:* ${botState.product.name} (ID: ${botState.product.id})
*Size:* ${botState.size}
*Polish:* ${botState.polish}
*Frame:* ${botState.frame}
${botState.comments ? `*Custom Requirements:* ${botState.comments}` : ''}
*Contact Details:*
- Name: ${botState.name}
- Phone: ${botState.phone}
  `;

  setTimeout(() => {
    botMessage(summaryText.trim().replace(/\n/g, '<br>'));
    
    // Add WhatsApp send button in bot message
    setTimeout(() => {
      const messages = document.getElementById('enq-messages');
      const el = document.createElement('div');
      el.className = 'enq-msg enq-msg-bot';
      el.style.width = '90%';
      el.style.maxWidth = '90%';
      el.innerHTML = `
        <div style="font-weight: 500; margin-bottom: 8px;">Ready to send?</div>
        <button class="enq-send-wa-btn" id="enqSendWaBtn">Send Enquiry on WhatsApp 🚀</button>
      `;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
      
      document.getElementById('enqSendWaBtn').addEventListener('click', () => {
        sendProductEnquiryToWhatsApp();
      });
    }, 600);
  }, 600);
}

function sendProductEnquiryToWhatsApp() {
  const message = 
`New Customized Enquiry via Silverhythm

Product: ${botState.product.name} (ID: ${botState.product.id})
Size: ${botState.size}
Polish: ${botState.polish}
Frame: ${botState.frame}
${botState.comments ? `Custom Requirements: ${botState.comments}\n` : ''}
Customer Details:
- Name: ${botState.name}
- Phone: ${botState.phone}
- Email: ${botState.email || 'Not provided'}

Sent from: ${window.location.href}`;

  const encoded = encodeURIComponent(message);
  const waNumber = State.get('whatsappNumber') || '916364051237';
  const url = `https://wa.me/${waNumber}?text=${encoded}`;

  window.open(url, '_blank', 'noopener,noreferrer');
  
  botMessage("Opened WhatsApp! Thank you for your enquiry 🙏 We'll connect with you shortly.");
  
  // Reset botState
  botState.step = null;
}

function botChoicesMessage(text, options, key, nextStep) {
  const messages = document.getElementById('enq-messages');
  const el = document.createElement('div');
  el.className = 'enq-msg enq-msg-choices';
  
  let optionsHTML = options.map((opt, i) => `
    <label class="enq-choice-label">
      <input type="radio" name="${key}" value="${opt}" ${i === 0 ? 'checked' : ''} class="enq-choice-radio">
      <span>${opt}</span>
    </label>
  `).join('');

  el.innerHTML = `
    <div class="enq-choices-text">${text.replace(/\*(.*?)\*/g, '<strong>$1</strong>')}</div>
    <div class="enq-choices-list">${optionsHTML}</div>
    <button class="enq-choices-submit-btn">Confirm</button>
  `;
  
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;

  const input = document.getElementById('enq-input');
  const sendBtn = document.getElementById('enq-send');
  if (input) {
    input.disabled = true;
    input.placeholder = "Please select an option above...";
  }
  if (sendBtn) {
    sendBtn.disabled = true;
  }

  const submitBtn = el.querySelector('.enq-choices-submit-btn');
  submitBtn.addEventListener('click', () => {
    const selected = el.querySelector(`input[name="${key}"]:checked`).value;
    
    // Disable all inputs in this message after selection
    el.querySelectorAll('input').forEach(input => input.disabled = true);
    submitBtn.remove();

    if (input) {
      input.disabled = false;
      input.placeholder = "Type a message...";
    }
    if (sendBtn) {
      sendBtn.disabled = false;
    }
    
    // Display user selection as a message
    userMessage(selected);
    
    // Save to botState
    botState[key] = selected;
    
    // Move to next step
    setTimeout(() => {
      if (nextStep === 'ask_polish') {
        askPolish();
      } else if (nextStep === 'ask_frame') {
        askFrame();
      } else if (nextStep === 'ask_comments') {
        askComments();
      }
    }, 600);
  });
}

function injectWhatsAppFab() {
  let el = document.getElementById('wa-fab');
  if (!el) {
    el = document.createElement('a');
    el.id = 'wa-fab';
    document.body.appendChild(el);
  }
  el.className = 'wa-fab';
  el.href = `https://wa.me/${State.get('whatsappNumber') || '916364051237'}`;
  el.target = '_blank';
  el.rel = 'noopener noreferrer';
  el.setAttribute('aria-label', 'WhatsApp');
  el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>`;
}

function injectInstagramFab() {
  let el = document.getElementById('instagram-fab');
  if (!el) {
    el = document.createElement('a');
    el.id = 'instagram-fab';
    document.body.appendChild(el);
  }
  el.href = 'https://www.instagram.com/silverhythm';
  el.target = '_blank';
  el.rel = 'noopener noreferrer';
  el.setAttribute('aria-label', 'Instagram');
  el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
}

function injectBubble() {
  const bubble = document.createElement('button');
  bubble.id = 'enq-bubble';
  bubble.setAttribute('aria-label', 'Enquiry');
  bubble.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8V4M12 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
      <rect x="4" y="8" width="16" height="12" rx="2" ry="2"/>
      <circle cx="9" cy="13" r="1" fill="currentColor"/>
      <circle cx="15" cy="13" r="1" fill="currentColor"/>
      <path d="M9 17h6"/>
      <path d="M4 14H2M20 14h2"/>
    </svg>
  `;
  document.body.appendChild(bubble);
}

function injectPanel() {
  const panel = document.createElement('div');
  panel.id = 'enq-panel';
  panel.innerHTML = `
    <div id="enq-header">
      <div id="enq-header-info">
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%;">
          <div id="enq-title" style="font-family: var(--serif); font-size: 15px; font-weight: 600; line-height: 1.25;">Silverhythm</div>
          <svg width="110" height="8" viewBox="0 0 120 8" fill="none" stroke="currentColor" stroke-width="0.8" style="display: block; margin: 4px auto 2px; color: inherit; opacity: 0.85;">
            <path d="M0 4h42c1-1 2-2 3.5-2s2.5 1 3.5 2c1 1 2 2 3.5 2c1.5 0 2.5-1 3.5-2M120 4H78c-1-1-2-2-3.5-2s-2.5 1-3.5 2c-1 1-2 2-3.5 2c-1.5 0-2.5-1-3.5-2" opacity="0.4"/>
            <circle cx="60" cy="4" r="1.2" fill="currentColor"/>
            <ellipse cx="60" cy="1.8" rx="0.6" ry="1.2" fill="currentColor"/>
            <ellipse cx="60" cy="6.2" rx="0.6" ry="1.2" fill="currentColor"/>
            <ellipse cx="57.5" cy="4" rx="1.2" ry="0.6" fill="currentColor"/>
            <ellipse cx="62.5" cy="4" rx="1.2" ry="0.6" fill="currentColor"/>
            <path d="M53 4c-2-1.5-3.5-1.5-5 0M67 4c2-1.5 3.5-1.5 5 0" fill="none" stroke="currentColor"/>
          </svg>
          <div id="enq-subtitle" style="font-family: var(--sans); font-size: 10px; opacity: 0.7;">Typically replies instantly</div>
        </div>
      </div>
      <button id="enq-close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div id="enq-messages"></div>
    <div id="enq-input-row">
      <input id="enq-input" type="text" placeholder="Type a message..." autocomplete="off">
      <button id="enq-send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(panel);
}

function wireEvents() {
  document.getElementById('enq-bubble').addEventListener('click', togglePanel);
  document.getElementById('enq-close').addEventListener('click', closePanel);

  const input = document.getElementById('enq-input');
  document.getElementById('enq-send').addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}

function togglePanel() {
  const panel = document.getElementById('enq-panel');
  if (panel.classList.contains('open')) {
    closePanel();
  } else {
    openPanel();
  }
}

function openPanel() {
  const panel = document.getElementById('enq-panel');
  panel.classList.add('open');

  // Only start conversation if fresh
  if (botState.step === null) {
    startConversation();
  }

  setTimeout(() => {
    document.getElementById('enq-input')?.focus();
  }, 300);
}

function closePanel() {
  document.getElementById('enq-panel').classList.remove('open');
}

async function startConversation() {
  // Reset state
  botState = { step: null, name: '', phone: '', email: '', queryParts: [], product: null, size: '', polish: '', frame: '', comments: '' };

  const user = State.get('user');

  if (user) {
    // Logged in — fetch full profile to get phone
    botState.name = user.name || '';
    botState.email = user.email || '';

    // Try to get phone from profile
    try {
      const res = await API.getProfile();
      if (res.ok && res.data && res.data.phone) {
        botState.phone = res.data.phone;
      }
    } catch (e) {}

    botMessage(`Hi ${botState.name.split(' ')[0]} 👋`);
    setTimeout(() => {
      botMessage("What's your enquiry about today?");
      botState.step = 'query';
    }, 600);
  } else {
    // Guest
    botMessage('Hi there 👋 Welcome to Silverhythm.');
    setTimeout(() => {
      botMessage("What's your name?");
      botState.step = 'name';
    }, 600);
  }
}

function handleSend() {
  const input = document.getElementById('enq-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  userMessage(text);

  // Small delay before bot replies — feels natural
  setTimeout(() => processStep(text), 500);
}

function processStep(text) {
  switch (botState.step) {

    case 'name':
      botState.name = text;
      botMessage(`Nice to meet you, ${text.split(' ')[0]} 😊`);
      setTimeout(() => {
        botMessage("What's your phone number so we can reach you?");
        botState.step = 'phone';
      }, 600);
      break;

    case 'phone':
      // Basic validation — must have at least 7 digits
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7) {
        botMessage("Please enter a valid phone number.");
        return;
      }
      botState.phone = text;
      botMessage("Got it.");
      setTimeout(() => {
        botMessage("What's your enquiry?");
        botState.step = 'query';
      }, 600);
      break;

    case 'query':
      botState.queryParts.push(text);
      botMessage("Got it. Anything else to add? Or type *done* to send.");
      botState.step = 'query_more';
      break;

    case 'query_more':
      if (text.toLowerCase() === 'done') {
        // Check if we have phone
        if (!botState.phone) {
          botMessage("One last thing — what's your phone number so we can reach you?");
          botState.step = 'phone_late';
        } else {
          sendToWhatsApp();
        }
      } else {
        botState.queryParts.push(text);
        botMessage("Noted. Anything else? Or type *done* to send.");
      }
      break;

    case 'phone_late':
      const d = text.replace(/\D/g, '');
      if (d.length < 7) {
        botMessage("Please enter a valid phone number.");
        return;
      }
      botState.phone = text;
      sendToWhatsApp();
      break;

    // --- Product customization flow steps ---
    case 'comments':
      botState.comments = text.toLowerCase() === 'none' ? '' : text;
      // Check if name and phone exist (e.g. from profile)
      if (!botState.name) {
        botMessage("What is your name?");
        botState.step = 'contact_name';
      } else if (!botState.phone) {
        botMessage("What is your phone number so we can reach you?");
        botState.step = 'contact_phone';
      } else {
        compileAndConfirmEnquiry();
      }
      break;

    case 'contact_name':
      botState.name = text;
      botMessage(`Nice to meet you, ${text.split(' ')[0]} 😊`);
      if (!botState.phone) {
        setTimeout(() => {
          botMessage("What is your phone number so we can reach you?");
          botState.step = 'contact_phone';
        }, 600);
      } else {
        compileAndConfirmEnquiry();
      }
      break;

    case 'contact_phone':
      const phoneDigits = text.replace(/\D/g, '');
      if (phoneDigits.length < 7) {
        botMessage("Please enter a valid phone number.");
        return;
      }
      botState.phone = text;
      compileAndConfirmEnquiry();
      break;
  }
}

function sendToWhatsApp() {
  botMessage("Perfect. Opening WhatsApp now... 🚀");

  const query = botState.queryParts.join('\n');

  const message = 
`New Enquiry via Silverhythm

Name: ${botState.name}
Phone: ${botState.phone}
Email: ${botState.email || 'Not provided'}

Query:
${query}

Sent from: ${window.location.href}`;

  const waNumber = State.get('whatsappNumber') || '916364051237';
  const url = `https://wa.me/${waNumber}?text=${encoded}`;

  setTimeout(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
    // Reset for next session
    botState.step = null;
    setTimeout(() => {
      botMessage("Your enquiry has been sent! We'll get back to you shortly 🙏");
    }, 1000);
  }, 800);
}

function botMessage(text) {
  const messages = document.getElementById('enq-messages');
  const el = document.createElement('div');
  el.className = 'enq-msg enq-msg-bot';
  // Support *bold* wrapping and line breaks
  el.innerHTML = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function userMessage(text) {
  const messages = document.getElementById('enq-messages');
  const el = document.createElement('div');
  el.className = 'enq-msg enq-msg-user';
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

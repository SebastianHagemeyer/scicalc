/* fx(x)=g PLUS — Scientific Calculator
 * Practical re-implementation in vanilla JS. Linear input display,
 * supports SHIFT / ALPHA / HYP modifiers, DRG modes, memory M,
 * Ans, factorials, nPr/nCr, sci notation, etc.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------ */
  /* State                                                         */
  /* ------------------------------------------------------------ */
  const state = {
    tokens: [],
    cursor: 0,
    shift: false,
    alpha: false,
    hyp: false,
    drg: "DEG",       // DEG | RAD | GRA
    memory: 0,
    ans: 0,
    sdMode: "dec",    // "dec" | "frac"
    result: null,     // last computed numeric value
    resultDisplay: "",
    err: null,
    showingResult: false,
  };

  /* ------------------------------------------------------------ */
  /* Buttons                                                       */
  /*   action / shiftAction / alphaAction format: "kind:payload"   */
  /*   kinds: digit, op, paren, fn, const, pf, sci, infix, comma,  */
  /*          mod, cmd                                             */
  /* ------------------------------------------------------------ */
  const BTNS = [
    /* Row 1 — small scientific */
    { id: "ABS",   cls: "fn",  main: "Abs",   shift: "",       alpha: "",
      action: "fn:abs(" },
    { id: "X3",    cls: "fn",  main: "x³",    shift: "∛",      alpha: "",
      action: "pf:³",          shiftAction: "fn:cbrt(" },
    { id: "FRAC",  cls: "fn",  main: "<span class='box'></span>/<span class='box'></span>", shift: "<span class='box'></span><span class='box'></span>/<span class='box'></span>", alpha: "",
      action: "cmd:frac",     shiftAction: "cmd:mfrac" },
    { id: "XINV",  cls: "fn",  main: "x⁻¹",  shift: "x!",      alpha: "",
      action: "pf:⁻¹",        shiftAction: "pf:!" },
    { id: "LOGB",  cls: "fn",  main: "log<sub>□</sub>", shift: "10ˣ", alpha: "",
      action: "fn:logb(",     shiftAction: "fn:pow10(" },
    { id: "LN",    cls: "fn",  main: "ln",    shift: "eˣ",     alpha: "e",
      action: "fn:ln(",       shiftAction: "fn:exp(", alphaAction: "const:e" },

    /* Row 2 */
    { id: "SQRT",  cls: "fn",  main: "√<span class='box'></span>", shift: "∛<span class='box'></span>", alpha: "",
      action: "fn:sqrt(",     shiftAction: "fn:cbrt(" },
    { id: "X2",    cls: "fn",  main: "x²",    shift: "√<span class='box'></span>", alpha: "",
      action: "pf:²",         shiftAction: "fn:sqrt(" },
    { id: "XY",    cls: "fn",  main: "x<span class='sup'>□</span>", shift: "<span class='sup'>□</span>√<span class='box'></span>", alpha: "",
      action: "op:^",         shiftAction: "fn:root(" },
    { id: "LOG",   cls: "fn",  main: "log",   shift: "10ˣ",    alpha: "",
      action: "fn:log(",      shiftAction: "fn:pow10(" },
    { id: "NEG",   cls: "fn",  main: "(-)",   shift: "",       alpha: "A",
      action: "neg",          alphaAction: "var:A" },
    { id: "DMS",   cls: "fn",  main: "°&#8242;&#8243;", shift: "↔", alpha: "B",
      action: "cmd:dms",      shiftAction: "cmd:dms_swap",     alphaAction: "var:B" },

    /* Row 3 */
    { id: "HYP",   cls: "fn",  main: "hyp",   shift: "",       alpha: "",
      action: "mod:hyp" },
    { id: "SIN",   cls: "fn",  main: "sin",   shift: "sin⁻¹", alpha: "D",
      action: "fn:sin(",      shiftAction: "fn:asin(",        alphaAction: "var:D" },
    { id: "COS",   cls: "fn",  main: "cos",   shift: "cos⁻¹", alpha: "E",
      action: "fn:cos(",      shiftAction: "fn:acos(",        alphaAction: "var:E" },
    { id: "TAN",   cls: "fn",  main: "tan",   shift: "tan⁻¹", alpha: "F",
      action: "fn:tan(",      shiftAction: "fn:atan(",        alphaAction: "var:F" },
    { id: "PI",    cls: "fn",  main: "π",     shift: "e",      alpha: "",
      action: "const:pi",     shiftAction: "const:e" },
    { id: "PCT",   cls: "fn",  main: "%",     shift: "",       alpha: "",
      action: "pf:%" },

    /* Row 4 */
    { id: "RCL",   cls: "fn",  main: "RCL",   shift: "STO",    alpha: "",
      action: "cmd:rcl",      shiftAction: "cmd:sto" },
    { id: "ENG",   cls: "fn",  main: "ENG",   shift: "←",      alpha: "",
      action: "cmd:eng",      shiftAction: "cmd:eng_back" },
    { id: "LPAREN", cls: "fn", main: "(",     shift: "",       alpha: "",
      action: "paren:(" },
    { id: "RPAREN", cls: "fn", main: ")",     shift: "",       alpha: "X",
      action: "paren:)",      alphaAction: "var:X" },
    { id: "SD",    cls: "fn",  main: "S↔D",  shift: "",       alpha: "Y",
      action: "cmd:sd",       alphaAction: "var:Y" },
    { id: "MPLUS", cls: "fn",  main: "M+",    shift: "M−",     alpha: "M",
      action: "cmd:mplus",    shiftAction: "cmd:mminus",      alphaAction: "var:M" },

  ];

  /* Numeric / operator buttons placed in their own 5-col grid */
  const BTNS_NUM = [
    { id: "N7",    cls: "num", main: "7",     action: "digit:7" },
    { id: "N8",    cls: "num", main: "8",     action: "digit:8" },
    { id: "N9",    cls: "num", main: "9",     action: "digit:9" },
    { id: "DEL",   cls: "fn",  main: "DEL",   shift: "INS",
      action: "cmd:del",  shiftAction: "cmd:ins" },
    { id: "AC",    cls: "green", main: "AC",  shift: "OFF",
      action: "cmd:ac",   shiftAction: "cmd:off" },

    { id: "N4",    cls: "num", main: "4",     action: "digit:4" },
    { id: "N5",    cls: "num", main: "5",     action: "digit:5" },
    { id: "N6",    cls: "num", main: "6",     action: "digit:6" },
    { id: "MUL",   cls: "fn",  main: "×",     shift: "nPr",
      action: "op:*",     shiftAction: "infix:nPr" },
    { id: "DIV",   cls: "fn",  main: "÷",     shift: "nCr",
      action: "op:/",     shiftAction: "infix:nCr" },

    { id: "N1",    cls: "num", main: "1",     shift: "STAT",
      action: "digit:1" },
    { id: "N2",    cls: "num", main: "2",     action: "digit:2" },
    { id: "N3",    cls: "num", main: "3",     action: "digit:3" },
    { id: "ADD",   cls: "fn",  main: "+",     shift: "Pol(",
      action: "op:+",     shiftAction: "fn:Pol(" },
    { id: "SUB",   cls: "fn",  main: "−",     shift: "Rec(",
      action: "op:-",     shiftAction: "fn:Rec(" },

    { id: "N0",    cls: "num", main: "0",     shift: "Rnd",
      action: "digit:0",  shiftAction: "fn:rnd(" },
    { id: "DOT",   cls: "num", main: ".",     shift: "Ran#",
      action: "digit:.",  shiftAction: "cmd:ran" },
    { id: "EXP",   cls: "num", main: "×10<span class='sup'>x</span>", shift: "π",
      action: "sci:exp",  shiftAction: "const:pi" },
    { id: "ANS",   cls: "num", main: "Ans",   shift: "DRG▶",
      action: "const:Ans", shiftAction: "cmd:drg" },
    { id: "EQ",    cls: "eq",  main: "=",
      action: "cmd:eq" },
  ];

  /* ------------------------------------------------------------ */
  /* Build keypads                                                 */
  /* ------------------------------------------------------------ */
  function buildKeypad(targetId, list) {
    const root = document.getElementById(targetId);
    for (const b of list) {
      const btn = document.createElement("button");
      btn.className = "kbtn " + b.cls;
      btn.dataset.key = b.id;
      btn.innerHTML =
        (b.shift ? `<span class="shift-label">${b.shift}</span>` : "") +
        (b.alpha ? `<span class="alpha-label">${b.alpha}</span>` : "") +
        `<span class="main">${b.main}</span>`;
      root.appendChild(btn);
    }
  }
  buildKeypad("keypadSci", BTNS);
  buildKeypad("keypadNum", BTNS_NUM);
  /* Make BTNS the union for lookup */
  const BTNS_ALL = BTNS.concat(BTNS_NUM);

  /* ------------------------------------------------------------ */
  /* Token definitions                                             */
  /* ------------------------------------------------------------ */
  function mkTok(kind, display, evalStr, extra) {
    return Object.assign({ kind, display, eval: evalStr }, extra || {});
  }

  function tokenForAction(action) {
    const colon = action.indexOf(":");
    const kind = colon === -1 ? action : action.slice(0, colon);
    const arg  = colon === -1 ? ""     : action.slice(colon + 1);
    switch (kind) {
      case "digit":
        return mkTok("digit", arg, arg);
      case "op": {
        const disp = arg === "*" ? "×" : arg === "/" ? "÷" : arg === "-" ? "−" : arg;
        return mkTok("op", disp, arg);
      }
      case "paren":
        return mkTok("paren", arg, arg);
      case "fn": {
        const remap = {
          "sqrt(":  { d: "√(",   e: "sqrt(" },
          "cbrt(":  { d: "∛(",   e: "cbrt(" },
          "pow10(": { d: "10^(", e: "pow10(" },
          "exp(":   { d: "e^(",  e: "exp(" },
          "logb(":  { d: "logb(", e: "logb(" },
          "root(":  { d: "root(", e: "root(" },
        };
        const r = remap[arg];
        if (r) return mkTok("fn", r.d, r.e);
        return mkTok("fn", arg, arg);
      }
      case "const": {
        if (arg === "pi") return mkTok("const", "π", "pi");
        if (arg === "e")  return mkTok("const", "e",  "e");
        if (arg === "Ans") return mkTok("const", "Ans", "Ans");
        return mkTok("const", arg, arg);
      }
      case "var":
        return mkTok("var", arg, arg);
      case "pf":
        return mkTok("pf", arg, arg);
      case "infix": {
        const sym = arg === "nPr" ? "P" : "C";
        return mkTok("infix", sym, " " + arg + " ");
      }
      case "sci":
        return mkTok("sci", "×10", "*10^");
      case "neg":
        return mkTok("neg", "−", "-");
      case "comma":
        return mkTok("comma", ",", ",");
    }
    return null;
  }

  /* ------------------------------------------------------------ */
  /* Renderer                                                      */
  /* ------------------------------------------------------------ */
  const exprLine = document.getElementById("exprLine");
  const resultLine = document.getElementById("resultLine");
  const indicators = document.getElementById("indicators");

  function renderToken(tok, nextTok) {
    switch (tok.kind) {
      case "fn":   return `<span class="tok-fn">${escape(tok.display)}</span>`;
      case "sci":  return `×10`;
      case "pf":   return tok.display === "²" ? "<span class='sup'>2</span>"
                       : tok.display === "³" ? "<span class='sup'>3</span>"
                       : tok.display === "⁻¹" ? "<span class='sup'>-1</span>"
                       : escape(tok.display);
      default:     return escape(tok.display);
    }
  }
  function escape(s) {
    return String(s).replace(/[&<>]/g, c =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"
    );
  }

  /* Build a map of fraction structures: open-index -> {open,bar,close} */
  function buildFracMap(toks) {
    const stack = [];
    const map = {};
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.kind === "frac_open") {
        const e = { open: i, bar: -1, close: -1 };
        stack.push(e);
        map[i] = e;
      } else if (t.kind === "frac_bar" && stack.length) {
        stack[stack.length - 1].bar = i;
      } else if (t.kind === "frac_close" && stack.length) {
        stack[stack.length - 1].close = i;
        stack.pop();
      }
    }
    return map;
  }

  /* Find the fraction record (open/bar/close) for a given index that is one
     of those three structural tokens. */
  function fracForIdx(toks, idx, map) {
    map = map || buildFracMap(toks);
    if (toks[idx] && toks[idx].kind === "frac_open") return map[idx];
    for (const k in map) {
      const e = map[k];
      if (e.bar === idx || e.close === idx) return e;
    }
    return null;
  }

  /* Innermost fraction containing the cursor position (cursor > open && cursor <= close). */
  function fracAroundCursor() {
    const map = buildFracMap(state.tokens);
    let best = null;
    for (const k in map) {
      const e = map[k];
      if (state.cursor > e.open && state.cursor <= e.close) {
        if (!best || e.open > best.open) best = e;
      }
    }
    return best;
  }

  function renderTokensRange(start, end) {
    const cursorEl = '<span class="cursor"></span>';
    const toks = state.tokens;
    let html = "";
    let i = start;
    let suppressNextCursor = false;
    while (i < end) {
      if (i === state.cursor) {
        if (!suppressNextCursor) html += cursorEl;
        suppressNextCursor = false;
      }
      const t = toks[i];
      if (t.kind === "frac_open") {
        const map = buildFracMap(toks);
        const e = map[i];
        const barIdx   = e && e.bar   >= 0 ? e.bar   : i + 1;
        const closeIdx = e && e.close >= 0 ? e.close : end - 1;
        let numH = renderTokensRange(i + 1, barIdx);
        let denH = renderTokensRange(barIdx + 1, closeIdx);
        if (!numH) numH = '<span class="ph">&#9633;</span>';
        if (!denH) denH = '<span class="ph">&#9633;</span>';
        html += `<span class="frac"><span class="num">${numH}</span><span class="den">${denH}</span></span>`;
        i = closeIdx + 1;
        continue;
      }
      if (t.kind === "frac_bar" || t.kind === "frac_close") {
        // structural separators are rendered by the enclosing frac_open
        i++;
        continue;
      }
      if (t.kind === "op" && t.eval === "^") {
        let j = i + 1;
        if (j < toks.length &&
            (toks[j].kind === "neg" ||
             (toks[j].kind === "op" && toks[j].eval === "-"))) {
          j++;
        }
        if (j < toks.length && toks[j].kind === "paren" && toks[j].display === "(") {
          let depth = 1;
          j++;
          while (j < toks.length && depth > 0) {
            if (toks[j].kind === "paren") {
              if (toks[j].display === "(") depth++;
              else if (toks[j].display === ")") depth--;
            }
            j++;
          }
        } else {
          while (j < toks.length && toks[j].kind === "digit") j++;
        }
        const innerH = renderTokensRange(i + 1, j);
        const supBody = innerH !== "" ? innerH : '<span class="ph">&#9633;</span>';
        html += `<span class="sup">${supBody}</span>`;
        if (state.cursor === j) suppressNextCursor = true;
        i = j;
        continue;
      }
      if (t.kind === "sci") {
        html += "×10";
        let j = i + 1;
        let exp = "";
        if (j < toks.length &&
            (toks[j].kind === "neg" || (toks[j].kind === "op" && toks[j].eval === "-"))) {
          exp += "-";
          j++;
        }
        while (j < toks.length && toks[j].kind === "digit") {
          exp += toks[j].display;
          j++;
        }
        if (exp) {
          if (state.cursor > i && state.cursor <= j) {
            let inner = "";
            for (let k = i + 1; k < j; k++) {
              if (k === state.cursor) inner += cursorEl;
              inner += escape(toks[k].display);
            }
            if (state.cursor === j) inner += cursorEl;
            html += `<span class="sup">${inner}</span>`;
          } else {
            html += `<span class="sup">${escape(exp)}</span>`;
          }
          i = j;
        } else {
          html += `<span class="sup">x</span>`;
          i++;
        }
        continue;
      }
      html += renderToken(t, toks[i + 1]);
      i++;
    }
    if (state.cursor === end && !suppressNextCursor) html += cursorEl;
    return html;
  }

  function renderExpr() {
    const html = renderTokensRange(0, state.tokens.length);
    exprLine.innerHTML = html || '<span class="cursor"></span>';
  }

  function prettifyResult(s) {
    // Convert "1.23×10^5" -> "1.23×10<sup>5</sup>" for nicer display
    return String(s).replace(/×10\^(-?\d+)/g, "×10<sup>$1</sup>");
  }

  function renderResult() {
    if (state.err) {
      resultLine.textContent = state.err;
      resultLine.style.color = "#a4421f";
      return;
    }
    resultLine.style.color = "";
    if (state.showingResult) {
      resultLine.innerHTML = prettifyResult(state.resultDisplay);
    } else {
      resultLine.innerHTML = "";
    }
  }

  function renderIndicators() {
    const map = {
      shift: state.shift,
      alpha: state.alpha,
      hyp:   state.hyp,
      m:     state.memory !== 0,
      drg:   true,
      math:  true,
      sto:   false,
      rcl:   false,
      updown: false,
    };
    for (const el of indicators.querySelectorAll(".ind")) {
      const k = el.dataset.ind;
      if (k === "drg") {
        el.textContent = state.drg === "DEG" ? "D" : state.drg === "RAD" ? "R" : "G";
        el.classList.add("on");
      } else {
        el.classList.toggle("on", !!map[k]);
      }
    }
    // Update modifier button visual highlight
    document.querySelectorAll(".kbtn.shift").forEach(b => b.classList.toggle("active", state.shift));
    document.querySelectorAll(".kbtn.alpha").forEach(b => b.classList.toggle("active", state.alpha));
  }

  function render() {
    renderExpr();
    renderResult();
    renderIndicators();
  }

  /* ------------------------------------------------------------ */
  /* Token insertion / deletion                                    */
  /* ------------------------------------------------------------ */
  function insertToken(tok) {
    if (state.showingResult) {
      // Continuing from a result. If the new token is an operator,
      // prepend Ans automatically. Otherwise start fresh.
      const continuesExpr =
        tok.kind === "op" || tok.kind === "pf" || tok.kind === "infix";
      if (continuesExpr) {
        state.tokens = [mkTok("const", "Ans", "Ans")];
        state.cursor = 1;
      } else {
        state.tokens = [];
        state.cursor = 0;
      }
      state.showingResult = false;
      state.err = null;
    }
    state.tokens.splice(state.cursor, 0, tok);
    state.cursor++;
  }

  function delToken() {
    if (state.showingResult) {
      // DEL after = clears the result and lets you keep editing
      state.showingResult = false;
      return;
    }
    if (state.cursor === 0) return;
    const prev = state.tokens[state.cursor - 1];
    if (prev && (prev.kind === "frac_open"
              || prev.kind === "frac_bar"
              || prev.kind === "frac_close")) {
      // Remove the entire fraction (open through close) including content.
      const e = fracForIdx(state.tokens, state.cursor - 1);
      if (e && e.open >= 0 && e.close >= 0) {
        state.tokens.splice(e.open, e.close - e.open + 1);
        state.cursor = e.open;
        return;
      }
    }
    state.tokens.splice(state.cursor - 1, 1);
    state.cursor--;
  }

  function insertFraction() {
    if (state.showingResult) {
      state.tokens = [];
      state.cursor = 0;
      state.showingResult = false;
      state.err = null;
    }
    const open  = mkTok("frac_open",  "", "(");
    const bar   = mkTok("frac_bar",   "", ")/(");
    const close = mkTok("frac_close", "", ")");
    state.tokens.splice(state.cursor, 0, open, bar, close);
    state.cursor += 1; // place inside numerator
  }

  /* UP/DOWN: move cursor between numerator and denominator of the innermost
     fraction containing the cursor. */
  function moveCursorUpDown(dir) {
    const e = fracAroundCursor();
    if (!e || e.bar < 0) return;
    if (dir < 0) {
      // UP: into numerator
      if (state.cursor > e.bar) state.cursor = e.bar;
    } else {
      // DOWN: into denominator
      if (state.cursor <= e.bar) state.cursor = e.bar + 1;
    }
    state.showingResult = false;
  }

  function insertMixedFraction() {
    // Mixed: whole [ num / den ] — modeled as (whole+(num)/(den))
    if (state.showingResult) {
      state.tokens = [];
      state.cursor = 0;
      state.showingResult = false;
      state.err = null;
    }
    // Insert: m_open, (whole), m_plus, frac_open, frac_bar, frac_close, m_close
    // We'll piggyback on regular tokens for the whole-part wrapping.
    const tokens = [
      mkTok("paren", "(", "("),
      mkTok("frac_open",  "", "("),
      mkTok("frac_bar",   "", ")/("),
      mkTok("frac_close", "", ")"),
      mkTok("paren", ")", ")"),
    ];
    state.tokens.splice(state.cursor, 0, ...tokens);
    // place cursor before the frac_open so user types whole part first;
    // they then press RIGHT to enter the fraction.
    state.cursor += 1;
  }

  function clearAll() {
    state.tokens = [];
    state.cursor = 0;
    state.err = null;
    state.showingResult = false;
    state.resultDisplay = "";
    state.hyp = false;
  }

  /* ------------------------------------------------------------ */
  /* Number formatting                                             */
  /* ------------------------------------------------------------ */
  function formatNumber(n) {
    if (n === null || n === undefined) return "";
    if (typeof n !== "number" || Number.isNaN(n)) return "Math ERROR";
    if (!Number.isFinite(n)) return "Math ERROR";
    // round tiny errors
    if (Math.abs(n) > 1e-12 && Math.abs(n) < 1) {
      // keep precision
    } else if (Math.abs(n - Math.round(n)) < 1e-10 && Math.abs(n) < 1e15) {
      n = Math.round(n);
    }
    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e10 || abs < 1e-4)) {
      // scientific
      const s = n.toExponential(9);
      return s.replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e")
              .replace("e+", "×10^").replace("e-", "×10^-")
              .replace("e", "×10^");
    }
    let s = n.toPrecision(12);
    // Trim trailing zeros after decimal
    if (s.indexOf(".") !== -1) s = s.replace(/\.?0+$/, "");
    return s;
  }

  function toFractionString(n) {
    if (!Number.isFinite(n)) return formatNumber(n);
    const sign = n < 0 ? -1 : 1;
    const x = Math.abs(n);
    if (x === Math.floor(x)) return formatNumber(n);
    // continued fraction up to 1e-10
    let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    for (let i = 0; i < 64; i++) {
      const a = Math.floor(b);
      const h2 = a * h1 + h0;
      const k2 = a * k1 + k0;
      if (k2 > 1e9) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      const diff = x - h1 / k1;
      if (Math.abs(diff) < 1e-12) break;
      b = 1 / (b - a);
      if (!Number.isFinite(b)) break;
    }
    if (k1 <= 1) return formatNumber(n);
    const num = sign * h1;
    if (Math.abs(num / k1 - n) > 1e-9) return formatNumber(n);
    return num + "/" + k1;
  }

  /* Stacked-fraction HTML for the result line; falls back to plain text if
     no clean rational approximation exists. Auto-extracts the integer part
     so e.g. 7/4 displays as 1¼ (mixed). */
  function toFractionHtml(n) {
    const s = toFractionString(n);
    if (!s.includes("/")) return formatNumber(n);
    const [a, b] = s.split("/").map(Number);
    const sign = a < 0 ? -1 : 1;
    const num = Math.abs(a);
    const den = b;
    const whole = Math.floor(num / den);
    const rem = num - whole * den;
    const wholeStr = whole > 0 ? (sign < 0 ? "-" + whole : whole) : (sign < 0 ? "-" : "");
    if (rem === 0) return String(sign * num / 1); // shouldn't hit
    const fracHtml =
      `<span class="frac"><span class="num">${rem}</span>` +
      `<span class="den">${den}</span></span>`;
    return wholeStr + fracHtml;
  }

  /* ------------------------------------------------------------ */
  /* Expression evaluator                                          */
  /* ------------------------------------------------------------ */
  function tokensToEvalString() {
    let s = "";
    let pendingHyp = false;
    for (const t of state.tokens) {
      let e = t.eval;
      if (t.kind === "neg") e = "(-1)*";
      s += e;
    }
    return s;
  }

  function lexEval(str) {
    const out = [];
    let i = 0;
    while (i < str.length) {
      const c = str[i];
      if (c === " " || c === "\t") { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < str.length && /[0-9.]/.test(str[j])) j++;
        out.push({ t: "num", v: parseFloat(str.slice(i, j)) });
        i = j; continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        let j = i;
        while (j < str.length && /[a-zA-Z0-9_]/.test(str[j])) j++;
        out.push({ t: "id", v: str.slice(i, j) });
        i = j; continue;
      }
      if ("+-*/^!%(),".includes(c)) {
        out.push({ t: "op", v: c });
        i++; continue;
      }
      if (c === "²") { out.push({ t: "op", v: "²" }); i++; continue; }
      if (c === "³") { out.push({ t: "op", v: "³" }); i++; continue; }
      if (c === "⁻" && str[i + 1] === "¹") {
        out.push({ t: "op", v: "⁻¹" }); i += 2; continue;
      }
      throw new Error("Bad char: " + c);
    }
    return out;
  }

  class Parser {
    constructor(toks) { this.toks = toks; this.i = 0; }
    peek(k) { return this.toks[this.i + (k || 0)]; }
    eat() { return this.toks[this.i++]; }
    is(t, v) {
      const x = this.peek();
      if (!x) return false;
      if (x.t !== t) return false;
      return v === undefined || x.v === v;
    }
    end() { return this.i >= this.toks.length; }

    parseExpr() { return this.parseAdd(); }

    parseAdd() {
      let lhs = this.parseMul();
      while (this.is("op", "+") || this.is("op", "-")) {
        const op = this.eat().v;
        const rhs = this.parseMul();
        lhs = op === "+" ? lhs + rhs : lhs - rhs;
      }
      return lhs;
    }

    parseMul() {
      let lhs = this.parseComb();
      while (true) {
        if (this.is("op", "*") || this.is("op", "/")) {
          const op = this.eat().v;
          const rhs = this.parseComb();
          lhs = op === "*" ? lhs * rhs : lhs / rhs;
        } else if (this.canStartImplicit()) {
          const rhs = this.parseComb();
          lhs = lhs * rhs;
        } else {
          break;
        }
      }
      return lhs;
    }

    canStartImplicit() {
      const t = this.peek();
      if (!t) return false;
      if (t.t === "id") return true;          // π, sin(, Ans, e
      if (t.t === "op" && t.v === "(") return true;
      return false;
    }

    parseComb() {
      let lhs = this.parsePow();
      while (this.is("id", "nPr") || this.is("id", "nCr")) {
        const op = this.eat().v;
        const rhs = this.parsePow();
        lhs = op === "nPr" ? perm(lhs, rhs) : comb(lhs, rhs);
      }
      return lhs;
    }

    parsePow() {
      const lhs = this.parseUnary();
      if (this.is("op", "^")) {
        this.eat();
        const rhs = this.parsePow();
        return Math.pow(lhs, rhs);
      }
      return lhs;
    }

    parseUnary() {
      if (this.is("op", "-")) { this.eat(); return -this.parseUnary(); }
      if (this.is("op", "+")) { this.eat(); return this.parseUnary(); }
      return this.parsePostfix();
    }

    parsePostfix() {
      let v = this.parsePrimary();
      while (true) {
        if (this.is("op", "!"))   { this.eat(); v = factorial(v); }
        else if (this.is("op", "²")) { this.eat(); v = v * v; }
        else if (this.is("op", "³")) { this.eat(); v = v * v * v; }
        else if (this.is("op", "⁻¹")) { this.eat(); v = 1 / v; }
        else if (this.is("op", "%"))  { this.eat(); v = v / 100; }
        else break;
      }
      return v;
    }

    parsePrimary() {
      const t = this.peek();
      if (!t) throw new Error("Unexpected end");
      if (t.t === "num") { this.eat(); return t.v; }
      if (t.t === "op" && t.v === "(") {
        this.eat();
        const v = this.parseExpr();
        if (!this.is("op", ")")) {
          // auto-close at end of input — convenience
          if (!this.end()) throw new Error("Expected )");
        } else {
          this.eat();
        }
        return v;
      }
      if (t.t === "id") {
        this.eat();
        // Function call?
        if (this.is("op", "(")) {
          this.eat();
          const args = [];
          if (!this.is("op", ")")) {
            args.push(this.parseExpr());
            while (this.is("op", ",")) {
              this.eat();
              args.push(this.parseExpr());
            }
          }
          if (this.is("op", ")")) this.eat();
          return applyFn(t.v, args);
        }
        return lookupName(t.v);
      }
      throw new Error("Unexpected: " + JSON.stringify(t));
    }
  }

  /* ------------------------------------------------------------ */
  /* Math helpers                                                  */
  /* ------------------------------------------------------------ */
  function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) throw new Error("Math ERROR");
    if (n > 170) throw new Error("Math ERROR");
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  function perm(n, r) {
    if (n < 0 || r < 0 || r > n || n !== Math.floor(n) || r !== Math.floor(r))
      throw new Error("Math ERROR");
    let v = 1;
    for (let i = 0; i < r; i++) v *= (n - i);
    return v;
  }
  function comb(n, r) {
    if (n < 0 || r < 0 || r > n || n !== Math.floor(n) || r !== Math.floor(r))
      throw new Error("Math ERROR");
    if (r > n - r) r = n - r;
    let v = 1;
    for (let i = 0; i < r; i++) v = v * (n - i) / (i + 1);
    return Math.round(v);
  }

  function toRad(x) {
    if (state.drg === "RAD") return x;
    if (state.drg === "GRA") return x * Math.PI / 200;
    return x * Math.PI / 180;
  }
  function fromRad(x) {
    if (state.drg === "RAD") return x;
    if (state.drg === "GRA") return x * 200 / Math.PI;
    return x * 180 / Math.PI;
  }

  function applyFn(name, args) {
    const a = args;
    switch (name) {
      case "sin":  return Math.sin(toRad(a[0]));
      case "cos":  return Math.cos(toRad(a[0]));
      case "tan":  return Math.tan(toRad(a[0]));
      case "asin": return fromRad(Math.asin(a[0]));
      case "acos": return fromRad(Math.acos(a[0]));
      case "atan": return fromRad(Math.atan(a[0]));
      case "sinh": return Math.sinh(a[0]);
      case "cosh": return Math.cosh(a[0]);
      case "tanh": return Math.tanh(a[0]);
      case "asinh": return Math.asinh(a[0]);
      case "acosh": return Math.acosh(a[0]);
      case "atanh": return Math.atanh(a[0]);
      case "log":   return Math.log10(a[0]);
      case "ln":    return Math.log(a[0]);
      case "logb":  return Math.log(a[1]) / Math.log(a[0]);
      case "exp":   return Math.exp(a[0]);
      case "pow10": return Math.pow(10, a[0]);
      case "sqrt":  return Math.sqrt(a[0]);
      case "cbrt":  return Math.cbrt(a[0]);
      case "root":  return Math.pow(a[1], 1 / a[0]);
      case "abs":   return Math.abs(a[0]);
      case "rnd":   return Math.round(a[0]);
      case "Pol":   return Math.sqrt(a[0] * a[0] + a[1] * a[1]); // returns r
      case "Rec":   return a[0] * Math.cos(toRad(a[1]));         // returns x
    }
    throw new Error("Unknown fn: " + name);
  }
  function lookupName(n) {
    if (n === "pi" || n === "PI") return Math.PI;
    if (n === "e")  return Math.E;
    if (n === "Ans") return state.ans;
    if (n === "M") return state.memory;
    if (/^[A-FXY]$/.test(n)) return state.vars[n] || 0;
    throw new Error("Unknown: " + n);
  }

  state.vars = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 };

  function evaluate() {
    // Apply hyp prefix: rewrite tokens so sin( -> sinh( etc. for this eval
    const evalStr = (() => {
      let s = "";
      let hypActive = state.hyp;
      for (const t of state.tokens) {
        let e = t.eval;
        if (hypActive && t.kind === "fn") {
          const m = e.match(/^(sin|cos|tan|asin|acos|atan)\($/);
          if (m) {
            e = (m[1].startsWith("a") ? "a" + m[1].slice(1) + "h(" : m[1] + "h(");
            hypActive = false;
          }
        }
        if (t.kind === "neg") e = "(-1)*";
        s += e;
      }
      return s;
    })();
    if (!evalStr.trim()) return 0;
    const toks = lexEval(evalStr);
    const p = new Parser(toks);
    const v = p.parseExpr();
    if (!p.end()) throw new Error("Syntax ERROR");
    return v;
  }

  /* ------------------------------------------------------------ */
  /* Key dispatch                                                  */
  /* ------------------------------------------------------------ */
  function pressKey(id) {
    if (id === "ON") {
      clearAll();
      state.shift = state.alpha = false;
      state.memory = 0; state.ans = 0;
      render();
      return;
    }
    if (id === "LEFT")  { if (state.cursor > 0) state.cursor--; state.showingResult = false; render(); return; }
    if (id === "RIGHT") { if (state.cursor < state.tokens.length) state.cursor++; state.showingResult = false; render(); return; }
    if (id === "UP")    { moveCursorUpDown(-1); render(); return; }
    if (id === "DOWN")  { moveCursorUpDown(+1); render(); return; }
    if (id === "MODE")  {
      state.drg = state.drg === "DEG" ? "RAD" : state.drg === "RAD" ? "GRA" : "DEG";
      render(); return;
    }

    if (state.err && id !== "AC" && id !== "DEL") {
      // any key after error: just clear error
      state.err = null;
      render();
      return;
    }

    if (id === "SHIFT") {
      state.shift = !state.shift;
      if (state.shift) state.alpha = false;
      render();
      return;
    }
    if (id === "ALPHA") {
      state.alpha = !state.alpha;
      if (state.alpha) state.shift = false;
      render();
      return;
    }

    const btn = BTNS_ALL.find(b => b.id === id);
    if (!btn) return;

    let action = btn.action;
    if (state.shift && btn.shiftAction) action = btn.shiftAction;
    else if (state.alpha && btn.alphaAction) action = btn.alphaAction;
    else if (state.shift && !btn.shiftAction && btn.shift) action = btn.action;
    else if (state.alpha && !btn.alphaAction && btn.alpha) action = btn.action;

    handleAction(action);

    // Auto-clear modifiers after one use (Casio behavior)
    if (id !== "SHIFT" && id !== "ALPHA" && id !== "HYP") {
      state.shift = false;
      state.alpha = false;
    }
    render();
  }

  function handleAction(action) {
    if (action === "noop") return;
    if (action === "neg") { insertToken(mkTok("neg", "−", "(-1)*")); return; }
    if (action.startsWith("mod:")) {
      const m = action.slice(4);
      if (m === "hyp") state.hyp = !state.hyp;
      return;
    }
    if (action.startsWith("cmd:")) {
      handleCmd(action.slice(4));
      return;
    }
    if (action.startsWith("var:")) {
      const v = action.slice(4);
      insertToken(mkTok("var", v, v));
      return;
    }
    const tok = tokenForAction(action);
    if (tok) {
      // Functions and scientific have implicit "(" — auto-balance hint
      insertToken(tok);
      // After inserting a sci token, also leave cursor right after it
    }
  }

  function handleCmd(cmd) {
    switch (cmd) {
      case "frac":
        insertFraction();
        break;
      case "mfrac":
        insertMixedFraction();
        break;
      case "ac":
        clearAll();
        break;
      case "off":
        clearAll();
        state.ans = 0;
        state.memory = 0;
        break;
      case "del":
        delToken();
        break;
      case "ins":
        // not implemented (cursor between tokens already)
        break;
      case "eq":
        doEvaluate();
        break;
      case "sd":
        if (state.showingResult && state.result !== null) {
          state.sdMode = state.sdMode === "dec" ? "frac" : "dec";
          state.resultDisplay = state.sdMode === "frac"
            ? toFractionHtml(state.result)
            : formatNumber(state.result);
        }
        break;
      case "mplus":
        if (state.tokens.length) {
          try {
            const v = evaluate();
            state.memory += v;
            state.ans = v;
            state.result = v;
            state.resultDisplay = formatNumber(v);
            state.showingResult = true;
          } catch (e) {
            state.err = "Syntax ERROR";
          }
        } else {
          state.memory += state.ans;
        }
        break;
      case "mminus":
        if (state.tokens.length) {
          try {
            const v = evaluate();
            state.memory -= v;
            state.ans = v;
            state.result = v;
            state.resultDisplay = formatNumber(v);
            state.showingResult = true;
          } catch (e) {
            state.err = "Syntax ERROR";
          }
        } else {
          state.memory -= state.ans;
        }
        break;
      case "rcl":
        // Show memory inline
        insertToken(mkTok("var", "M", "M"));
        break;
      case "sto":
        // store current Ans / current value to M
        if (state.tokens.length) {
          try { state.ans = evaluate(); } catch (e) {}
        }
        state.memory = state.ans;
        state.showingResult = true;
        state.result = state.memory;
        state.resultDisplay = formatNumber(state.memory);
        break;
      case "drg": {
        state.drg = state.drg === "DEG" ? "RAD"
                  : state.drg === "RAD" ? "GRA" : "DEG";
        break;
      }
      case "ran":
        insertToken(mkTok("num", formatNumber(Math.random()), String(Math.random())));
        break;
      case "eng":
        // multiply display by 10^3 -- simplified: shift exponent
        if (state.showingResult && state.result !== null) {
          state.result = state.result; // no-op; display only
          state.resultDisplay = engNotation(state.result, 1);
        }
        break;
      case "eng_back":
        if (state.showingResult && state.result !== null) {
          state.resultDisplay = engNotation(state.result, -1);
        }
        break;
      case "dms":
      case "dms_swap":
        // Simplified: if result is decimal, show as DMS
        if (state.showingResult && state.result !== null) {
          state.resultDisplay = toDMS(state.result);
        }
        break;
    }
  }

  function engNotation(n, dir) {
    if (n === 0) return "0";
    const e = Math.floor(Math.log10(Math.abs(n)));
    const cur = Math.floor(e / 3) * 3;
    const next = cur + 3 * dir;
    const m = n / Math.pow(10, next);
    return `${m}×10^${next}`;
  }

  function toDMS(n) {
    const sign = n < 0 ? -1 : 1;
    const x = Math.abs(n);
    const deg = Math.floor(x);
    const mFloat = (x - deg) * 60;
    const min = Math.floor(mFloat);
    const sec = (mFloat - min) * 60;
    return `${sign < 0 ? "-" : ""}${deg}°${min}′${sec.toFixed(2)}″`;
  }

  function doEvaluate() {
    if (state.tokens.length === 0) return;
    try {
      const v = evaluate();
      state.ans = v;
      state.result = v;
      state.resultDisplay = formatNumber(v);
      state.showingResult = true;
      state.sdMode = "dec";
      state.hyp = false;
      state.err = null;
    } catch (e) {
      state.err = "Syntax ERROR";
    }
  }

  /* ------------------------------------------------------------ */
  /* Click handling                                                */
  /* ------------------------------------------------------------ */
  function bindClicks(root) {
    root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-key]");
      if (!t) return;
      const k = t.dataset.key;
      flash(t);
      pressKey(k);
    });
  }
  function flash(el) {
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 80);
  }
  bindClicks(document);

  /* ------------------------------------------------------------ */
  /* Keyboard support                                              */
  /* ------------------------------------------------------------ */
  const KEY_MAP = {
    "0": "N0", "1": "N1", "2": "N2", "3": "N3", "4": "N4",
    "5": "N5", "6": "N6", "7": "N7", "8": "N8", "9": "N9",
    ".": "DOT",
    "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV",
    "^": "XY", "(": "LPAREN", ")": "RPAREN",
    "=": "EQ", "Enter": "EQ",
    "Backspace": "DEL", "Delete": "DEL",
    "Escape": "AC",
  };
  const KEY_NAMED = {
    "p": () => insertToken(tokenForAction("const:pi")),
    "P": () => insertToken(tokenForAction("const:pi")),
    "s": () => insertToken(tokenForAction("fn:sin(")),
    "c": () => insertToken(tokenForAction("fn:cos(")),
    "t": () => insertToken(tokenForAction("fn:tan(")),
    "S": () => insertToken(tokenForAction("fn:sqrt(")),
    "l": () => insertToken(tokenForAction("fn:log(")),
    "n": () => insertToken(tokenForAction("fn:ln(")),
    "!": () => insertToken(tokenForAction("pf:!")),
    "%": () => insertToken(tokenForAction("pf:%")),
    "a": () => insertToken(tokenForAction("const:Ans")),
    ",": () => insertToken(tokenForAction("comma:,")),
  };
  document.addEventListener("keydown", (e) => {
    // ignore when focus is in an input (none here, but safety)
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "ArrowLeft") {
      if (state.cursor > 0) state.cursor--;
      state.showingResult = false; render();
      e.preventDefault(); return;
    }
    if (e.key === "ArrowRight") {
      if (state.cursor < state.tokens.length) state.cursor++;
      state.showingResult = false; render();
      e.preventDefault(); return;
    }
    if (e.key === "ArrowUp")   { moveCursorUpDown(-1); render(); e.preventDefault(); return; }
    if (e.key === "ArrowDown") { moveCursorUpDown(+1); render(); e.preventDefault(); return; }
    const mapped = KEY_MAP[e.key];
    if (mapped) {
      e.preventDefault();
      const btn = document.querySelector(`[data-key="${mapped}"]`);
      if (btn) flash(btn);
      pressKey(mapped);
      return;
    }
    const named = KEY_NAMED[e.key];
    if (named) {
      e.preventDefault();
      named();
      render();
      return;
    }
  });

  /* ------------------------------------------------------------ */
  /* Init                                                          */
  /* ------------------------------------------------------------ */
  render();
})();

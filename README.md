# scicalc

A web-based scientific calculator styled after a classic handheld unit,
with a stacked natural-display fraction renderer and a full set of
shifted/alpha key labels. Live at:

**https://sebastianhagemeyer.github.io/scicalc/**

No build step — open `index.html` in a browser.

## What it can do

- **Arithmetic** with proper precedence: `+ − × ÷ ^`, right-associative
  exponent, implicit multiplication (`2π`, `3sin(30)`), and unary minus
  via the dedicated `(-)` key.
- **Trig and inverse trig** in degrees, radians, or gradians. Press
  **MODE** (or **SHIFT + Ans** for DRG▶) to cycle the angle unit.
- **Hyperbolic** functions via the **hyp** prefix (`hyp` then `sin` →
  sinh, etc.).
- **Logs and exponents**: `log` (base 10), `ln`, custom-base `log_□`,
  `10ˣ`, `eˣ`.
- **Roots and powers**: `x²`, `x³`, `x⁻¹`, `√`, `∛`, custom `□√`, and
  `x^□`.
- **Combinatorics**: factorial (`x!`), permutations (`nPr`), and
  combinations (`nCr`).
- **Constants and variables**: π, e, `Ans` (last result), and the
  alpha-accessed letters `A–F`, `X`, `Y`, plus memory `M`.
- **Memory**: `M+`, `M−`, `STO`, and the `M` indicator on the display.
- **Scientific notation**: the `×10ˣ` key adds a superscripted exponent.
- **Random**: `Ran#` (uniform 0–1) via **SHIFT + .**.
- **Percentages and rounding**: `%`, `Rnd`.
- **Polar / rectangular**: `Pol(`, `Rec(`.
- **Natural fractions**: the **▢/▢** key inserts a true stacked
  fraction. Type the numerator, **▶** (or **▼**) to jump to the
  denominator, **▶** again to leave. Fractions can be nested.
- **S↔D**: after pressing `=`, toggle the result between decimal and a
  stacked-fraction approximation (e.g. `0.75 ↔ 3/4`).
- **Ans chaining**: pressing an operator right after `=` prepends `Ans`
  so you can keep computing from the previous result.

## Display

Two-line LCD-tinted screen:

- Top line shows the running expression with the cursor, rendered with
  superscript exponents and stacked fractions.
- Bottom line shows the most recent result.
- A row of indicators at the top of the display lights up `S`, `A`,
  `M`, `HYP`, the current angle unit (`D`/`R`/`G`), and `Math`.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `0`–`9`, `.` | Digits |
| `+`, `-`, `*`, `/` | Operators |
| `^`, `(`, `)` | Power / parentheses |
| `Enter`, `=` | Evaluate |
| `Backspace` | DEL |
| `Esc` | AC |
| `←` / `→` | Move cursor |
| `↑` / `↓` | Jump between numerator and denominator |
| `s`, `c`, `t` | sin / cos / tan |
| `S` | √( |
| `l`, `n` | log( / ln( |
| `p` | π |
| `a` | Ans |
| `!`, `%` | Factorial / percent |

## Files

- `index.html` — markup for the calculator body, display, d-pad, and
  the two keypad grids.
- `styles.css` — the dark-bezel look, button gradients, LCD, indicator
  strip, and stacked-fraction layout.
- `calculator.js` — token model, recursive-descent expression
  evaluator, SHIFT/ALPHA/HYP modifiers, memory, DRG modes, fraction
  structure handling, and keyboard bindings.

## How it works under the hood

Each press appends a typed *token* (digit, operator, function-open,
constant, etc.) into a flat list at the cursor position. Fractions are
modeled as three structural tokens — `frac_open`, `frac_bar`,
`frac_close` — which the renderer collapses into stacked HTML and the
evaluator concatenates into `( … )/( … )`. Evaluation runs a
recursive-descent parser over the joined eval-string, handling implicit
multiplication, postfix operators (`!`, `²`, `³`, `⁻¹`, `%`), and the
infix `nPr` / `nCr` between regular operands.

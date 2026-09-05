/**
 * Formula Evaluator — Safe Expression Parser for Salary Rules
 * Owner: P3 (Payroll)
 * 
 * Strict Security Rules:
 * - NO eval()
 * - NO new Function()
 * - NO dynamic code execution
 * 
 * Implements a clean Shunting-Yard tokenizer & Abstract Syntax Tree / RPN evaluator
 * that safely computes salary expressions like:
 *   "BASIC + HRA + TRANSPORT + SPL_ALLOW"
 *   "GROSS - TOTAL_DEDUCTIONS"
 *   "BASIC * 0.40"
 *   "(BASIC + HRA) * 0.12"
 */

class FormulaEvaluationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FormulaEvaluationError';
    this.statusCode = 400;
  }
}

/**
 * Tokenize a mathematical expression string into a stream of safe tokens
 * @param {string} formula
 * @returns {Array<{type: string, value: string|number}>}
 */
function tokenize(formula) {
  if (!formula || typeof formula !== 'string') {
    throw new FormulaEvaluationError('Formula must be a non-empty string');
  }

  const tokens = [];
  let i = 0;
  const len = formula.length;

  while (i < len) {
    const char = formula[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Number literals (integers and decimals)
    if (/[0-9]/.test(char) || (char === '.' && i + 1 < len && /[0-9]/.test(formula[i + 1]))) {
      let numStr = '';
      let hasDot = false;
      while (i < len && (/[0-9]/.test(formula[i]) || formula[i] === '.')) {
        if (formula[i] === '.') {
          if (hasDot) throw new FormulaEvaluationError(`Malformed decimal number near index ${i}`);
          hasDot = true;
        }
        numStr += formula[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }

    // Identifiers (Variable rule codes, e.g. BASIC, HRA, PF_EMP, TOTAL_DEDUCTIONS)
    if (/[a-zA-Z_]/.test(char)) {
      let ident = '';
      while (i < len && /[a-zA-Z0-9_]/.test(formula[i])) {
        ident += formula[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: ident.toUpperCase() });
      continue;
    }

    // Operators
    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    throw new FormulaEvaluationError(`Unexpected character '${char}' in salary formula at position ${i}`);
  }

  return tokens;
}

/**
 * Convert Infix token stream to Postfix (Reverse Polish Notation) using Shunting-Yard
 * @param {Array} tokens
 * @returns {Array}
 */
function toRPN(tokens) {
  const output = [];
  const operatorStack = [];

  const precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'NUMBER' || token.type === 'IDENTIFIER') {
      output.push(token);
    } else if (token.type === 'OPERATOR') {
      // Handle unary minus (e.g. "-10" or "5 * -2")
      if (token.value === '-' && (i === 0 || tokens[i - 1].type === 'OPERATOR' || tokens[i - 1].type === 'LPAREN')) {
        // Treat as 0 - operand
        output.push({ type: 'NUMBER', value: 0 });
      }

      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
        precedence[operatorStack[operatorStack.length - 1].value] >= precedence[token.value]
      ) {
        output.push(operatorStack.pop());
      }
      operatorStack.push(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      let foundMatching = false;
      while (operatorStack.length > 0) {
        const top = operatorStack.pop();
        if (top.type === 'LPAREN') {
          foundMatching = true;
          break;
        }
        output.push(top);
      }
      if (!foundMatching) {
        throw new FormulaEvaluationError('Mismatched parentheses: missing opening parenthesis');
      }
    }
  }

  while (operatorStack.length > 0) {
    const top = operatorStack.pop();
    if (top.type === 'LPAREN') {
      throw new FormulaEvaluationError('Mismatched parentheses: missing closing parenthesis');
    }
    output.push(top);
  }

  return output;
}

/**
 * Safely evaluate a salary formula given a context dictionary of component values
 * @param {string} formula - Expression to evaluate
 * @param {Record<string, number>} context - Dictionary of already calculated rule codes (e.g. { BASIC: 30000, HRA: 12000 })
 * @returns {number} Evaluated monetary amount rounded to 2 decimal places
 */
function evaluateFormula(formula, context = {}) {
  if (typeof formula !== 'string' || !formula.trim()) {
    return 0.00;
  }

  const tokens = tokenize(formula);
  if (tokens.length === 0) return 0.00;

  const rpn = toRPN(tokens);
  const evalStack = [];

  // Normalize context keys to uppercase
  const normalizedContext = {};
  for (const [k, v] of Object.entries(context)) {
    normalizedContext[k.toUpperCase()] = parseFloat(v) || 0;
  }

  for (const token of rpn) {
    if (token.type === 'NUMBER') {
      evalStack.push(token.value);
    } else if (token.type === 'IDENTIFIER') {
      if (!(token.value in normalizedContext)) {
        throw new FormulaEvaluationError(
          `Formula refers to unknown or unevaluated component '${token.value}'. Available context components: [${Object.keys(normalizedContext).join(', ')}]`
        );
      }
      evalStack.push(normalizedContext[token.value]);
    } else if (token.type === 'OPERATOR') {
      if (evalStack.length < 2) {
        throw new FormulaEvaluationError(`Insufficient operands for operator '${token.value}'`);
      }
      const b = evalStack.pop();
      const a = evalStack.pop();

      let res = 0;
      switch (token.value) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) {
            throw new FormulaEvaluationError('Division by zero in salary formula calculation');
          }
          res = a / b;
          break;
        default:
          throw new FormulaEvaluationError(`Unsupported operator '${token.value}'`);
      }
      evalStack.push(res);
    }
  }

  if (evalStack.length !== 1) {
    throw new FormulaEvaluationError('Invalid formula syntax: evaluation produced multiple remaining operands');
  }

  const result = evalStack[0];
  if (isNaN(result) || !isFinite(result)) {
    throw new FormulaEvaluationError('Formula evaluation resulted in NaN or non-finite number');
  }

  return Math.round(result * 100) / 100;
}

/**
 * Validate formula syntax without executing against dynamic context
 * @param {string} formula
 * @param {string[]} availableComponentCodes
 * @returns {{isValid: boolean, error?: string}}
 */
function validateFormula(formula, availableComponentCodes = []) {
  try {
    const mockContext = {};
    for (const code of availableComponentCodes) {
      mockContext[code.toUpperCase()] = 100;
    }
    evaluateFormula(formula, mockContext);
    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: err.message };
  }
}

module.exports = {
  evaluateFormula,
  validateFormula,
  FormulaEvaluationError,
};

/**
 * Endpoint Validator Gate
 * @module /api/gates/endpointValidation
 */


const { isURL, isJSON, validateEmail } = require("../../utils");
const { makeStandardError } = require('../../http');
const { REQUEST:{ MALFORMED_VALIDATION:MALFORMED } } = require('../../errors/errors.json');
const { INTERFACE: { VALIDATION } } = require('../../enums');


const ERROR = {
  MISSING_ARG   : 'missing_arg',
  MAX_LENGTH    : 'max_length_exceeded',
  MIN_LENGTH    : 'min_length_not_met',
  INVALID_EMAIL : 'invalid_email',
  ARG_MISMATCH  : 'argument_type_mismatch',
  OUT_OF_RANGE  : 'argument_out_of_range',
  NOT_URL       : 'argument_not_url',
  NOT_JSON      : 'argument_not_json',
  NOT_ARRAY     : 'argument_not_an_array',
  REGEX         : 'argument_invalid_pattern'
};

/**
 * Enforces validation rules on received args for endpoint parameters.
 *
 * @param {object} data - args {} object of request object.
 * @param {object} params - parameter definitions from interface.
 * @returns {object} data - original data object
 *
 * @throws Malformed request with type_specification
 *
 * @example args {}
 * 	{
 * 	  username: "jon@parsony.com",
 * 	  password: "*********"
 * 	}
 *
 * @example params []
 *  [
 *     {
 *        "param": "username",
 *        "required": true,
 *        "validation": {
 *            "is_type": "string",
 *            "valid_email": true
 *         }
 *      },
 *      {
 *        "param": "password",
 *        "required": true,
 *        "validation": {
 *          "is_type": "string",
 *          "min_length": "6"
 *        }
 *      }
 *   ]
 */
const endpointValidationGateAsync = async (data, params) => {
  const errors = [];

  params.forEach( def => {
    const rules = Object.keys(def[VALIDATION]);
    const param = def.param;

    if (data.hasOwnProperty(param)) {
      rules.forEach( rule => {
          const arg = data[param];
          const error = _validate(arg, def, rule);
          if(error){
            errors.push(error)
          }
        })
    } else if(def.required) {
      errors.push(_missingArgError(param));
    }
  });

  if (errors.length === 0) {
    return data;
  } else {
    throw makeStandardError(
      MALFORMED,
      errors);
  }
};


/**
 * Compares passed arg for param to validation rule
 *
 * @param arg - argument passed to endpoint
 * @param def - parameter definition from contract
 * @param type - type of validation
 * @return {object} - error object or NULL
 *
 * @private
 */
function _validate(arg, def, type) {
  const param = def.param;
  const comp = def[VALIDATION][type];

  const validator = VALIDATIONS_MAP[type];
  const test = validator.test;
  const error = validator.error;

  if (!test(arg, comp)) {
    return error(arg, param, comp)
  } else {
    return null;
  }
}

const VALIDATIONS_MAP = {
  max_length: {
    test: _maxLength,
    error: _maxLengthError
  },
  min_length: {
    test: _minLength,
    error: _minLengthError
  },
  valid_email: {
    test: _isEmail,
    error: _emailError
  },
  is_type: {
    test: _isType,
    error: _typeError
  },
  in_set: {
    test: _inSet,
    error: _inSetError
  },
  is_url: {
    test: _isUrl,
    error: _isUrlError
  },
  is_json: {
    test: _isJSON,
    error: _isJsonError
  },
  is_array: {
    test: _isArray,
    error: _isArrayError
  },
  regex: {
    test : _regexTest,
    error: _isRegexError
  }
};

function _maxLength(arg, comp) {
  return arg.split('').length <= comp;
}

function _minLength(arg, comp) {
  return arg.split('').length >= comp;
}

function _isEmail(arg) {
  return validateEmail(arg);
}

function _isType(arg, comp) {
  if (comp === 'date') {
    return Date.parse(arg);
  }
  else {
    return typeof arg === comp;
  }
}

function _inSet(arg, comp) {
  return comp.indexOf(arg) > -1
}

function _isUrl(arg) {
  return isURL(arg);
}

function _isJSON(arg) {
  return isJSON(arg)
}

function _isArray(arg) {
  return Array.isArray(arg)
}

function _regexTest(arg, comp){
  const regex = new RegExp(comp);
  return regex.test(arg);
}

function _missingArgError(param) {
  return _validationError(
    ERROR.MISSING_ARG,
    param,
    null
  );
}

function _maxLengthError(arg, def, required) {
  return _validationError(
    ERROR.MAX_LENGTH,
    def,
    {
      max: required,
      sent: arg.split('').length
    }
  )
}

function _minLengthError(arg, def, required) {
  return _validationError(
    ERROR.MIN_LENGTH,
    def,
    {
      min: required,
      sent: arg.split('').length
    }
  )
}

function _emailError(arg, def) {
  return _validationError(
    ERROR.INVALID_EMAIL,
    def,
    arg
  )
}

function _typeError(arg, def, required) {
  return _validationError(
    ERROR.ARG_MISMATCH,
    def,
    {
      expected_type: required,
      provided_type: typeof arg
    }
  )
}

function _inSetError(arg, def, required) {
  return _validationError(
    ERROR.OUT_OF_RANGE,
    def,
    {
      acceptable_set: required,
      sent: arg
    }
  )
}

function _isUrlError(arg, def) {
  return _validationError(
    ERROR.NOT_URL,
    def,
    arg
  )
}

function _isJsonError(arg, def) {
  return _validationError(
    ERROR.NOT_JSON,
    def,
    arg
  )
}

function _isArrayError(arg, def) {
  return _validationError(
    ERROR.NOT_ARRAY,
    def,
    arg
  )
}

function _isRegexError(arg, def, required) {
  return _validationError(
    ERROR.REGEX,
    def,
    {
      expected_pattern: required,
      provided: arg
    }
  )
}

function _validationError(code, param, opt) {
  return {
    code,
    param,
    opt_desc: opt
  }
}

module.exports = {
  endpointValidationGateAsync
};
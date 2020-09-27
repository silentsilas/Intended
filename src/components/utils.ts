/* eslint-disable no-extra-boolean-cast */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
if (typeof Object.assign != 'function') {
  // @ts-ignore
  Object.assign = function(target, _varArgs) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    const to = Object(target);

    for (let index = 1; index < arguments.length; index++) {
      // @ts-ignore
      // eslint-disable-next-line prefer-rest-params
      const nextSource = arguments[index];

      if (nextSource != null) { // Skip over if undefined or null
        for (const nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

export function camelCase(name: string) {
  return name.replace(/([\:\-\_]+(.))/g, function (_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  });
}

export function isUndefined(value: any) {
  return typeof value === 'undefined'
}

export function isDefined(value: any) {
  return typeof value !== 'undefined'
}

export function isObject(value: any) {
  return value !== null && typeof value === 'object'
}

export function isString(value: any) {
  return typeof value === 'string'
}

export function isNumber(value: any) {
  return typeof value === 'number'
}

export function isFunction(value: any) {
  return typeof value === 'function'
}

export function objectExtend(a: any, b: any) {

  // Don't touch 'null' or 'undefined' objects.
  if (a == null || b == null) {
    return a;
  }

  Object.keys(b).forEach(function (key) {
    if (Object.prototype.toString.call(b[key]) == '[object Object]') {
      if (Object.prototype.toString.call(a[key]) != '[object Object]') {
        a[key] = b[key];
      } else {
        a[key] = objectExtend(a[key], b[key]);
      }
    } else {
      a[key] = b[key];
    }
  });

  return a;
};

/**
 * Assemble url from two segments
 * 
 * @author Sahat Yalkabov <https://github.com/sahat>
 * @copyright Method taken from https://github.com/sahat/satellizer
 * 
 * @param  {String} baseUrl Base url
 * @param  {String} url     URI
 * @return {String}
 */
export function joinUrl(baseUrl: string, url: string) {
  if (/^(?:[a-z]+:)?\/\//i.test(url)) {
    return url;
  }
  const joined = [baseUrl, url].join('/');
  const normalize = function (str: string) {
    return str
      .replace(/[\/]+/g, '/')
      .replace(/\/\?/g, '?')
      .replace(/\/\#/g, '#')
      .replace(/\:\//g, '://');
  };
  return normalize(joined);
}

/**
 * Get full path based on current location
 * 
 * @author Sahat Yalkabov <https://github.com/sahat>
 * @copyright Method taken from https://github.com/sahat/satellizer
 * 
 * @param  {Location} location
 * @return {String}
 */
export function getFullUrlPath(location: Location | HTMLAnchorElement) {
  const isHttps = location.protocol === 'https:';
  return location.protocol + '//' + location.hostname +
    ':' + (location.port || (isHttps ? '443' : '80')) +
    (/^\//.test(location.pathname) ? location.pathname : '/' + location.pathname);
}

/**
 * Parse query string variables
 * 
 * @author Sahat Yalkabov <https://github.com/sahat>
 * @copyright Method taken from https://github.com/sahat/satellizer
 * 
 * @param  {String} Query string
 * @return {String}
 */
export function parseQueryString(str: string) {
  const obj = {};
  let key;
  let value;
  (str || '').split('&').forEach((keyValue) => {
    if (keyValue) {
      value = keyValue.split('=');
      key = decodeURIComponent(value[0]);
      // @ts-ignore
      obj[key] = (!!value[1]) ? decodeURIComponent(value[1]) : true;
    }
  });
  return obj;
}

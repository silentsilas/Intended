/* eslint-disable @typescript-eslint/no-explicit-any */

import { objectExtend, parseQueryString, getFullUrlPath, isUndefined } from './utils';

/**
 * OAuth2 popup management class
 * 
 * @author Sahat Yalkabov <https://github.com/sahat>
 * @copyright Class mostly taken from https://github.com/sahat/satellizer 
 * and adjusted to fit vue-authenticate library
 */
export default class OAuthPopup {
  private popup: Window | null;
  private url: string;
  private name: string;
  private popupOptions: any;

  public constructor(url: string, name: string, popupOptions: any) {
    this.popup = null
    this.url = url
    this.name = name
    this.popupOptions = popupOptions
  }

  public open(redirectUri: string, skipPooling: boolean) {
    try {
      this.popup = window.open(this.url, this.name, this.popupOptions); // this._stringifyOptions())
      if (this.popup && this.popup.focus) {
        this.popup.focus()
      }

      if (skipPooling) {
        return Promise.resolve()
      } else {
        return this.pooling(redirectUri)
      }
    } catch(e) {
      return Promise.reject(new Error('OAuth popup error occurred'))
    }
  }

  private pooling(redirectUri: string) {
    return new Promise((resolve, reject) => {
      // create a hidden URL 
      const redirectUriParser = document.createElement('a');
      redirectUriParser.href = redirectUri;
      const redirectUriPath = getFullUrlPath(redirectUriParser);

      let poolingInterval: NodeJS.Timeout | null;

      poolingInterval = setInterval(() => {
        if (!this.popup || this.popup.closed || this.popup.closed === undefined) {
          clearInterval(poolingInterval as NodeJS.Timeout);
          poolingInterval = null;
          reject(new Error('The user closed the popup!'));
          return;
        }

        try {

          const popupWindowPath = getFullUrlPath(this.popup.location);

          if (popupWindowPath === redirectUriPath) {
            if (this.popup.location.search || this.popup.location.hash) {
              const query = parseQueryString(this.popup.location.search.substring(1).replace(/\/$/, ''));
              // eslint-disable-next-line no-useless-escape
              const hash = parseQueryString(this.popup.location.hash.substring(1).replace(/[\/$]/, ''));
              let params = objectExtend({}, query);
              params = objectExtend(params, hash)

              if (params.error) {
                reject(new Error(params.error));
              } else {
                resolve(params);
              }
            } else {
              reject(new Error('OAuth redirect has occurred but no query or hash parameters were found.'));
            }

            clearInterval(poolingInterval as NodeJS.Timeout);
            poolingInterval = null;
            this.popup.close();
          }
        } catch(e) {
          // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
        }
      }, 250)
    })
  }

  private _stringifyOptions() {
    const options = [];
    for (const optionKey in this.popupOptions) {
      if (!isUndefined(this.popupOptions[optionKey])) {
        options.push(`${optionKey}=${this.popupOptions[optionKey]}`)
      }
    }
    return options.join(',')
  }
}
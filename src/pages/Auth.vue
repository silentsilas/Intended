<template>
  <q-page class="row justify-center text-center">
    <div class="page-wrapper">
      <q-list no-border>
        <p class="page-header">Do I know you?</p>
        <p>Please identify yourself to reveal this message.</p>
        <q-item>
          <q-input
            label="Username / Email"
            class="fullwidth-input"
            ref="user"
            v-model="user"
            disable
            stack-label
            outlined />
        </q-item>
        <q-item>
          <q-input
            label="Service"
            class="fullwidth-input"
            ref="service"
            v-model="service"
            disable
            stack-label
            outlined />
        </q-item>
        <q-item>
          <q-btn class="q-py-sm q-px-xl full-width" 
            @click="tryToAuthenticate" 
            :disable="authenticating"
            color="primary"
            label="Authenticate" />
        </q-item>
        <q-item>
          <q-item-section>
            <q-input
              label="The secret essage will appear here."
              class="fullwidth-input"
              ref="secret"
              v-model="plaintext"
              outlined
              type="textarea" />
          </q-item-section>
          <q-item-section side>
            <q-icon name="file_copy" color="primary" @click.native="copySecret" />
          </q-item-section>
        </q-item>
        <div>
          {{ error }}
        </div>
      </q-list>
    </div>
  </q-page>
</template>

<script lang="ts">
import { QDialog } from 'quasar';
import Vue from 'vue'
import Component from 'vue-class-component';
import axios from 'axios';
import HexMix from '@/components/HexMix.ts';
import OAuthPopup from '@/components/OAuthPopup';

interface GithubEmail {
  email: string,
  primary: boolean,
  verified: boolean
};

@Component
export default class Auth extends Vue {
  private authenticating: boolean = false;
  private user: string = '';
  private service: string = '';
  private uuid: string = '';
  private decoder: TextDecoder = new TextDecoder();
  private plaintext: string = '';
  private error: string = '';

  async mounted() {
    this.uuid = this.$route.params.id;
    const response = await axios.get(`https://auth.intended.link/api/${this.uuid}`);
    this.user = response.data.user;
    this.service = response.data.service;
  }

  private async tryToAuthenticate() {
    try {
      this.authenticating = true;
      await this.authenticate();
    } catch (err) {
      if (err.response) {
        if (err.response.data instanceof Blob) {
          // TODO: blob.text() may not work in older browsers
          // But doing the traditional FileReader way is a pain
          err.response.data.text().then((jsonResponse: string) => {
            // don't parse json in case it's not json. formatting will just look weird.
            this.error = jsonResponse;
            window.alert(jsonResponse);
          });
        } else {
          window.alert(err.response.data);
        }
      }
      else if (err.request) {
        if (err.request.data) {
          window.alert(err.request.data)
        } else {
          window.alert('There was an issue sending your request. Contact the owner for halp.');
        }
      }
      else {
        if (err.message) {
          window.alert(err.message);
        } else {
          window.alert(err);
        }
      }
    } finally {
      this.authenticating = false;
    }
  }

  private async authenticate() {
    // First we'll get the oauth code for the client
    // @ts-ignore
    // this.$auth.authenticate('github', {
    //   uuid: this.uuid
    // }).then( (data: any) => {
    //   const reader = new FileReader();
    //   reader.onloadend = this.loadFile;
    //   reader.readAsArrayBuffer(data);
    // }).catch( (err: any) => {
    //   if (err && err.response) {
    //     const data = err.response.data;
    //     const reader = new FileReader();
    //     reader.onloadend = this.loadFile;
    //     reader.readAsArrayBuffer(data);
    //   }
    //   // eslint-disable-next-line
    //   console.log(JSON.stringify(err));
    // });
    // TODO: Maybe see if this can be done in one post request?
    // Look into a way to add response-type: 'blob' to this.$auth.authenticate

    // With that, we may request the encrypted data if our identity matches
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const authWindow = new OAuthPopup(`https://auth.intended.link/auth?provider=GitHub&uuid=${this.uuid}&redirectUri=${redirectUri}`, 'authWindow', 'width=600,height=400,scrollbars=yes');
    const success: any = await authWindow.open(redirectUri, false);
    // @ts-ignore

    const { data } = await axios.get('https://auth.intended.link/auth/data', {
      params: {
        redirectUri: redirectUri,
        uuid: this.uuid,
        state: success.state,
        code: success.code
      },
      responseType: 'blob'
    });

    const reader = new FileReader();
    reader.onloadend = this.loadFile;
    reader.readAsArrayBuffer(data);

  }

  private loadFile(fileEvent: ProgressEvent<FileReader>) {
    // Make sure we actually got a binary file
    if (fileEvent && fileEvent.target && 
        fileEvent.target.result instanceof ArrayBuffer) {
      this.decrypt(fileEvent.target.result as ArrayBuffer);
    } else {
      throw new Error('File is either missing or corrupt.');
    }
  }
  
  private async decrypt(file: ArrayBuffer) {

    const fragmentData = window.location.hash.substr(1);
    const keyParameters = JSON.parse(atob(fragmentData));
    const key = HexMix.hexToUint8(keyParameters.key);
    const iv = HexMix.hexToUint8(keyParameters.iv);

    const importedKey = await window.crypto.subtle.importKey(
      'raw',
      key,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
    const encoded = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        length: 256,
        iv: iv
      },
      importedKey,
      file
    );

    // And voila
    this.plaintext = this.decoder.decode(encoded);
  }

  private copySecret() {
    const secretEl: HTMLInputElement = (this.$refs.secret as HTMLInputElement);
    secretEl.select();
    try {
      document.execCommand('copy');
      this.$q.notify({
        message: 'Successfully copied to clipboard!',
        position: 'bottom',
      });
    } catch (err) {
      this.$q.notify({
        message: `Unable to copy to clipboard: ${err}`,
        position: 'bottom',
      });
    }
  }
}
</script>

<style lang="scss">
  .page-wrapper {
    width: 800px;
    max-width: 100vw;
  }
  .fullwidth-input {
    width: 100%;
  }
  .page-header {
    font-size: 28px;
    margin: 20px 0px 5px 0px;
  }
</style>

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
              label="The secret message will appear here."
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
        <q-item>
          <a class="full-width" :href="fileUrl" :download="filename">
            <q-btn class="q-py-sm q-px-xl full-width" 
              :disable="plaintext == ''"
              color="primary"
              label="Download" />
          </a>
        </q-item>
        <div>
          {{ error }}
        </div>
      </q-list>
    </div>
  </q-page>
</template>

<script lang="ts">
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
  private plaintext: string = '';
  private error: string = '';
  private fileUrl: string = '#';
  private filetype: string = 'text/plain';
  private filename: string = '';

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
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const authWindow = new OAuthPopup(`https://auth.intended.link/auth?provider=GitHub&uuid=${this.uuid}&redirectUri=${redirectUri}`, 'authWindow', 'width=600,height=400,scrollbars=yes');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const success: any = await authWindow.open(redirectUri, false);

    const response = await axios.get('https://auth.intended.link/auth/data', {
      params: {
        redirectUri: redirectUri,
        uuid: this.uuid,
        state: success.state,
        code: success.code
      },
      responseType: 'json'
    });

    const arrayReader = new FileReader();
    arrayReader.onloadend = this.loadFile;

    const binary = atob(response.data.file);
    this.filetype = response.data.filetype;
    const blobParts = new Uint8Array(binary.length);
    for( var i = 0; i < binary.length; i++ ) { blobParts[i] = binary.charCodeAt(i) }
    const fileBlob = new Blob([blobParts], { type: this.filetype });
    
    arrayReader.readAsArrayBuffer(fileBlob);

    this.filename = response.data.filename;
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
    HexMix.arrayBufferToString(encoded, (result:string) => {
      this.plaintext = result;
    });
    
    const blob = new Blob([encoded], {type: this.filetype });
    this.fileUrl = window.URL.createObjectURL(blob);
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

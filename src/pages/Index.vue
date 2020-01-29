<template>
  <q-page class="row justify-center">
    <div class="page-wrapper">
      <form @submit.prevent.stop="generateUrl" class="q-pa-md">
        <q-input
          label="Enter your secret here."
          class="fullwidth-input"
          ref="secret"
          v-model="plaintext"
          outlined
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Field is required' ]"
          type="textarea" />
        <q-input
          label="Their Username / Email"
          class="fullwidth-input"
          ref="account"
          v-model="account"
          outlined
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Field is required' ]"
          />

        <!-- <div class="row">
          <div class="col-xs-12 col-sm-6 col-md-4">

          </div>
        </div> -->
        <q-item-label>Type of account:</q-item-label>
        <div class="q-gutter-md q-pb-md">
          <q-radio v-model="service" val="github" label="Github" />
          <q-radio disable v-model="service" val="gmail" label="Gmail" />
          <q-radio disable v-model="service" val="live" label="Live" />
          <q-radio disable v-model="service" val="twitter" label="Twitter" />
        </div>
        <q-btn 
          class="q-py-sm q-px-xl full-width" 
          type="submit" 
          label="Generate URL" 
          :disable="generating" />
      </form>
      <q-list>
        <q-item>
          <q-item-section>
            <q-input
              label="URL will appear here."
              class="fullwidth-input"
              v-model="url"
              outlined
              ref="url"
              stack-label />
          </q-item-section>

          <q-item-section side>
            <q-icon name="file_copy" color="primary" @click.native="copyUrl" />
          </q-item-section>
        </q-item>

        <q-item>
          <q-input
            style="word-break: break-all;"
            label="Here's the encrypted data we've sent to the server."
            class="fullwidth-input"
            v-model="encryptedText"
            outlined
            stack-label
            type="textarea"
            disable />
        </q-item>
        <!-- <q-item>
          <q-btn class="q-py-sm q-px-xl full-width" @click="authenticate" label="Test Github Auth" />
        </q-item> -->
      </q-list>
    </div>
  </q-page>
</template>

<script lang="ts">
import { QDialog } from 'quasar';
import Vue from 'vue'
import axios from 'axios';
import Component from 'vue-class-component';


@Component
export default class PageIndex extends Vue {

  private encoder: TextEncoder = new TextEncoder();
  private decoder: TextDecoder = new TextDecoder();

  private plaintext: string = '';
  private account: string = '';
  private service: string = 'github';
  private url: string = '';

  private encryptedText: string = '';

  private generating: boolean = false;

  private async generateUrl () {
    if (!crypto.subtle || this.generating) {
      return;
    }

    this.$refs.secret.validate();
    this.$refs.account.validate();

    if (this.$refs.secret.hasError || this.$refs.account.hasError) {
      return;
    }

    this.generating = true;
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    const encoded = this.encoder.encode(this.plaintext);
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const exported = await window.crypto.subtle.exportKey('raw', key);
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encoded
    );

    // encrypted will be sent to lumen backend
    this.encryptedText = this.decoder.decode(encrypted);

    const keyHex = this.uint8ToHex(new Uint8Array(exported));
    const ivHex = this.uint8ToHex(iv);
    const urlParams = {
      key: keyHex,
      iv: ivHex
    };
    
    this.url = `${window.location.origin}/for/you/#${btoa(JSON.stringify(urlParams))}`;

    console.log(iv)
    console.log(this.hexToUint8(ivHex));

    console.log(new Uint8Array(exported));
    console.log(this.hexToUint8(keyHex));
    this.generating = false;
  }

  private uint8ToHex(data: Uint8Array): string {
    return Array.prototype.map.call(data, (byte: number) => {
      return ('00' + byte.toString(16)).slice(-2);
    }).join('');
  }

  private hexToUint8(data: string): Uint8Array {
    const hexArray = data.match(/.{1,2}/g);
    if (!hexArray) return new Uint8Array(0);

    return Uint8Array.from(hexArray.map((char: string) => {
      return parseInt(char, 16)
    }));
  }


  private authenticate() {
    this.$auth.authenticate('github').then( (res) => {
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${res.data.access_token}`}
      }).then( (response) => {
        console.log(response);
        window.alert(response.data.login);
      }).catch( (err) => {
        window.alert(err);
      });

      // if backend says it's an email, then hit email endpoint
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${res.data.access_token}`}
      }).then( (response) => {
        console.log(response);
      }).catch( (err) => {
        window.alert(err);
      })
    });
  }

  private copyUrl() {
    const urlEl: HTMLInputElement = (this.$refs.url as HTMLInputElement);
    urlEl.select();
    try {
      document.execCommand('copy');
      this.$q.notify({
        message: 'Successfully copied to clipboard!',
        position: 'bottom', // 'top', 'left', 'bottom-left' etc.
      });
    } catch (err) {
      this.$q.notify({
        message: `Unable to copy to clipboard: ${err}`,
        position: 'bottom', // 'top', 'left', 'bottom-left' etc.
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
</style>

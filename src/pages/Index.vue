<template>
  <q-page class="row justify-center">
    <div class="page-wrapper">
      <div class="text-center">
        <p class="page-header">Securely Share Your Secrets</p>
        <p>Only the person with the account you specify will be able to decrypt your message.</p>
      </div>
      <form @submit.prevent.stop="generateUrl" class="q-pa-md">
        <q-input
          :label="plainfile == null ? 'Enter your secret here.' : 'The file contents we will encrypt.'"
          class="fullwidth-input"
          ref="secret"
          v-model="plaintext"
          outlined
          lazy-rules
          :disable="plainfile != null"
          :rules="[ val => val && val.length > 0 || 'Field is required' ]"
          type="textarea" />
          <q-file
            class="fullwidth-input q-pb-md"
            v-model="plainfile"
            ref="file"
            outlined
            label="Or select your secret file."
            @input="onFileInput"
          >
          <template v-slot:prepend>
            <q-icon name="cloud_upload" />
          </template>
        </q-file>
        <q-input
          label="Their Username / Email"
          class="fullwidth-input"
          ref="user"
          v-model="user"
          outlined
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Field is required' ]"
          />
        <p>Type of account:</p>
        <div class="q-gutter-md q-pb-md">
          <q-radio v-model="service" val="github" label="Github" />
          <!-- <q-radio disable v-model="service" val="gmail" label="Gmail" />
          <q-radio disable v-model="service" val="twitter" label="Twitter" /> -->
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
      </q-list>
    </div>
  </q-page>
</template>

<script lang="ts">
import { QFile } from 'quasar';
import Vue from 'vue'
import axios from 'axios';
import Component from 'vue-class-component';
import HexMix from '@/components/HexMix';


@Component
export default class PageIndex extends Vue {
  private plaintext: string = '';
  private plainfile: File | null = null;
  private user: string = '';
  private service: string = 'github';
  private url: string = '';

  private encryptedText: string = '';

  private generating: boolean = false;

  private async generateUrl () {
    if (!crypto.subtle || this.generating) {
      return;
    }

    // @ts-ignore
    this.$refs.secret.validate();
    // @ts-ignore
    this.$refs.user.validate();

    // @ts-ignore
    if (this.$refs.secret.hasError || this.$refs.user.hasError) {
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
    const encoded = HexMix.stringToArrayBuffer(this.plaintext);
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
    this.encryptedText = HexMix.arrayBufferToString(encrypted);

    const keyHex = HexMix.uint8ToHex(new Uint8Array(exported));
    const ivHex = HexMix.uint8ToHex(iv);
    const keyParams = {
      key: keyHex,
      iv: ivHex
    };

    const formData = new FormData();
    const blobData = new Blob([encrypted]);
    formData.append('user', this.user);
    formData.append('service', this.service);
    formData.append('blob', blobData);
    formData.append('filetype', this.plainfile != null ? this.plainfile.type : 'text/plain');
    formData.append('filename', this.plainfile != null ? this.plainfile.name : 'secret.txt');

    try {
      const createdResponse = await axios.post('https://auth.intended.link/api', formData);
      this.url = `${window.location.origin}/for/you/${btoa(createdResponse.data.id)}#${btoa(JSON.stringify(keyParams))}`;
    } catch (err) {
      this.$q.notify({
        message: err.message,
        position: 'bottom'
      });
    }

    this.generating = false;
  }

  private onFileInput(file: File | null) {
    if (file instanceof File) {
      if (file.size > 2097152) {
        this.$q.notify({
          message: 'Error: Max file size is 2mb.',
          position: 'bottom',
        });
        const fileInput = (this.$refs.file as QFile);
        fileInput.removeAtIndex(0);
        fileInput.blur();
        return;
      }

      const reader = new FileReader();
      reader.onloadend = this.loadFile;
      reader.readAsArrayBuffer(file);
    }
  }

  private loadFile(fileEvent: ProgressEvent<FileReader>) {
    // Make sure we actually got a binary file
    if (fileEvent && fileEvent.target && 
        fileEvent.target.result instanceof ArrayBuffer) {
      const data = (fileEvent.target.result as ArrayBuffer);
      this.plaintext = HexMix.arrayBufferToString(data);
    } else {
      this.$q.notify({
        message: 'File is either missing or corrupt.',
        position: 'bottom',
      });
    }
  }

  private copyUrl() {
    const urlEl: HTMLInputElement = (this.$refs.url as HTMLInputElement);
    urlEl.select();
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
    font-size: 24px;
    margin: 20px 0px 5px 0px;
  }
</style>

<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import VueAxios from 'vue-axios';
// @ts-ignore
import VueAuthenticate from 'vue-authenticate';
import axios from 'axios';

Vue.use(VueAxios, axios);
Vue.use(VueAuthenticate, {
  baseUrl: 'https://auth.intended.link',

  providers: {
    github: {
      url: '/github',
      clientId: '1e5157418654c212b0a0',
      redirectUri: window.location.origin
    }
  }
})

@Component
export default class App extends Vue {}
</script>

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
  providers: {
    github: {
      url: '/auth/github',
      clientId: '1e5157418654c212b0a0',
      redirectUri: 'https://intended.link'
    }
  }
})

@Component
export default class App extends Vue {}
</script>

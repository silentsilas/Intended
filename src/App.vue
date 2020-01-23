<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import VueAxios from 'vue-axios';
import VueAuthenticate from 'vue-authenticate';
import axios from 'axios';

Vue.use(VueAxios, axios);
Vue.use(VueAuthenticate, {
  baseUrl: 'http//localhost:8080',

  providers: {
    github: {
      clientId: '',
      redirectUri: 'http://localhost:8080/#/auth/callback'
    }
  }
})

@Component
export default class App extends Vue {}
</script>

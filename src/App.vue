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
  baseUrl: 'http://intended.link',

  providers: {
    github: {
      clientId: '1e5157418654c212b0a0',
      redirectUri: 'http://intended.link'
    }
  }
})

@Component
export default class App extends Vue {}
</script>

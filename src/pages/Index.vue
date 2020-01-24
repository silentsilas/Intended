<template>
  <q-page class="flex flex-center">
    <img alt="Quasar logo" src="~assets/quasar-logo-full.svg">
    <q-btn @click="authenticate" label="auth" />
  </q-page>
</template>

<script lang="ts">
import Vue from 'vue'
import axios from 'axios';
import Component from 'vue-class-component';


@Component
export default class PageIndex extends Vue {
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
    });
  }
}
</script>

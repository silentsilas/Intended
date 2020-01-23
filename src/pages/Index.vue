<template>
  <q-page class="flex flex-center">
    <img alt="Quasar logo" src="~assets/quasar-logo-full.svg">
    <q-btn @click="authenticate" label="auth" />
  </q-page>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';


@Component
export default class PageIndex extends Vue {
  private authenticate() {
    this.$auth.authenticate('github').then( () => {
      window.alert('heyyo success');
    });
  }
}
</script>

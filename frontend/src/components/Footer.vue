<template>
  <v-footer dark height="auto" >
    <v-card class="dark lighten-1 white--text text-xs-center" min-width="100%">
      <v-card-text>
        <v-btn v-for="icon in icons" :key="icon" class="mx-3 white--text" icon>
          <v-icon size="24px">{{ icon }}</v-icon>
        </v-btn>
      </v-card-text>

      <v-card-text class="white--text pt-0">
        This site is for example use only including subscribe and account function. No userinfo is collected and stored.
        Please don't abuse the API calls. You can get source code by click on the github icon above
      </v-card-text>

      <v-divider></v-divider>

      <v-card-text class="white--text">&copy;2019 —
        <strong>fakeshadow</strong>
      </v-card-text>
    </v-card>
  </v-footer>
</template>

<script lang="ts">
export default {
  name: "Footer",
  data() {
    return {
      icons: [
        'fab fa-facebook',
        'fab fa-twitter',
        'fab fa-google-plus',
        'fab fa-linkedin',
        'fab fa-instagram'
      ]
    };
  }
};
</script>

<style scoped>
</style>

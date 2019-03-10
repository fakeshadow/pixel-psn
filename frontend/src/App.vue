<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" :clipped="true" fixed app disable-resize-watcher>
      <v-list dense>
        <router-link to="/">Home</router-link>
        <router-link to="/store">Store</router-link>
        <router-link to="/people">People</router-link>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar
      :clipped-left="$vuetify.breakpoint.lgAndUp"
      color="blue"
      dark
      app
      fixed
      scroll-toolbar-off-screen
    >
      <v-toolbar-title style="width: 300px" class="ml-0 pl-3">
        <v-toolbar-side-icon @click.stop="drawer = !drawer" class="hidden-md-and-up"></v-toolbar-side-icon>
        <span class="hidden-sm-and-down">
          <v-btn to="/" flat ripple class="text-none">
            <h1>PixelShare</h1>
          </v-btn>
        </span>
      </v-toolbar-title>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn to="/store" flat>Store</v-btn>
        <v-btn to="/people" flat>People</v-btn>
        <v-btn flat>About</v-btn>
      </v-toolbar-items>
      <v-spacer></v-spacer>

      <AuthDialog v-on:gotToken="gotToken" v-if="jwt === null"/>
      <UserMenu v-if="jwt !== null" v-on:lostToken="lostToken"/>
    </v-toolbar>
    <v-snackbar v-model="showSnack" :timeout="5000" top class="text-xs-center">
      {{ this.snackMessage }}
      <v-btn color="pink" flat @click="showSnack = false">Close</v-btn>
    </v-snackbar>
    <v-content>
      <router-view v-on:gotSnack="gotSnack"/>
    </v-content>
  </v-app>
</template>

<script>
import AuthDialog from "@/components/AuthDialog";
import UserMenu from "@/components/UserMenu";

export default {
  name: "app",
  components: {
    AuthDialog,
    UserMenu
  },
  data() {
    return {
      drawer: false,
      jwt: null,

      showSnack: false,
      snackMessage: null
    };
  },
  mounted() {
    if (localStorage.jwt) {
      this.jwt = localStorage.jwt;
    }
  },
  methods: {
    async gotToken(jwt) {
      this.jwt = jwt;
      localStorage.jwt = this.jwt;
    },
    async lostToken(boolean) {
      if (boolean) this.jwt = null;
    },
    gotSnack(snack) {
      if (snack.error) {
        this.snackMessage = snack.error;
      } else if (snack.success) {
        this.snackMessage = snack.success;
      }
      this.showSnack = true;
    }
  }
};
</script>

<style scoped>
</style>
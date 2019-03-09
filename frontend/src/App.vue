<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" :clipped="true" fixed app disable-resize-watcher>
      <v-list dense>
        <template v-for="item in items">
          <v-layout v-if="item.heading" :key="item.heading" row align-center>
            <v-flex xs6>
              <v-subheader v-if="item.heading">{{ item.heading }}</v-subheader>
            </v-flex>
            <v-flex xs6 class="text-xs-center">
              <a href="#!" class="body-2 black--text">EDIT</a>
            </v-flex>
          </v-layout>
          <v-list-group
            v-else-if="item.children"
            :key="item.text"
            v-model="item.model"
            :prepend-icon="item.model ? item.icon : item['icon-alt']"
            append-icon
          >
            <template v-slot:activator>
              <v-list-tile>
                <v-list-tile-content>
                  <v-list-tile-title>{{ item.text }}</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
            </template>
            <v-list-tile v-for="(child, i) in item.children" :key="i">
              <v-list-tile-action v-if="child.icon">
                <v-icon>{{ child.icon }}</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>{{ child.text }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list-group>
          <v-list-tile v-else :key="item.text">
            <v-list-tile-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>{{ item.text }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar :clipped-left="$vuetify.breakpoint.lgAndUp" color="blue" dark app fixed>
      <v-toolbar-title style="width: 300px" class="ml-0 pl-3">
        <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
        <span class="hidden-sm-and-down">
          <v-btn @click="profile =null;storeItems=null" flat ripple class="text-none">
            <h1>PixelShare</h1>
          </v-btn>
        </span>
      </v-toolbar-title>

      <AuthDialog v-on:gotToken="gotToken" v-if="jwt === null"/>
      <UserMenu v-if="jwt !== null" v-on:lostToken="lostToken" v-on:gotSuccess="gotSuccess"/>
    </v-toolbar>
    <v-content>
      <v-container @click="drawer = false">
        <v-layout justify-center align-center column>
          <v-snackbar v-model="showError" :timeout="5000" top>{{ this.error }}</v-snackbar>
          <v-snackbar v-model="showSuccess" :timeout="5000" top>{{ this.success }}</v-snackbar>
          <SearchBar v-on:addSearch="addSearch"/>

          <Loading v-if="isloading"/>
          <Welcome v-if="!isloading && !profile && !storeItems"/>
        </v-layout>
        <v-layout wrap row justify-center>
          <v-flex xs12 lg8>
            <Profile v-if="profile !== null" v-bind:profile="profile"/>
          </v-flex>
        </v-layout>
        <StoreItems v-if="storeItems !== null" v-bind:storeItems="storeItems"/>
      </v-container>
    </v-content>
    <v-dialog v-model="regionDialog" scrollable max-width="200px">
      <template v-slot:activator="{ on }">
        <v-btn fab bottom right color="blue" dark fixed v-on="on">
          <v-icon>language</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>Select Your Region</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-radio-group v-model="storeChange" column>
            <v-radio label="US" value="en:US"></v-radio>
            <v-radio label="UK" value="en:UK"></v-radio>
            <v-radio label="HongKong" value="en:HK"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn color="blue darken-1" flat @click="regionDialog = false">Close</v-btn>
          <v-btn color="blue darken-1" flat @click="changeStoreSetting">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import Welcome from "./components/Welcome";
import Profile from "./components/Profile";
import SearchBar from "./components/SearchBar";
import StoreItems from "./components/StoreItems";
import Loading from "./components/Loading";
import AuthDialog from "./components/AuthDialog";
import UserMenu from "./components/UserMenu";

export default {
  name: "app",
  components: {
    Welcome,
    Profile,
    StoreItems,
    SearchBar,
    Loading,
    AuthDialog,
    UserMenu
  },
  data() {
    return {
      profile: null,
      storeItems: null,
      isloading: false,
      drawer: false,

      jwt: null,
      storeChange: null,
      regionDialog: false,
      showError: false,
      error: null,
      showSuccess: false,
      success: null,

      currentRegion: { language: "en", region: "US" },
      items: [
        { icon: "contacts", text: "Contacts" },
        { icon: "history", text: "Frequently contacted" },
        { icon: "content_copy", text: "Duplicates" },
        {
          icon: "keyboard_arrow_up",
          "icon-alt": "keyboard_arrow_down",
          text: "Labels",
          model: true,
          children: [{ icon: "add", text: "Create label" }]
        },
        {
          icon: "keyboard_arrow_up",
          "icon-alt": "keyboard_arrow_down",
          text: "More",
          model: false,
          children: [
            { text: "Import" },
            { text: "Export" },
            { text: "Print" },
            { text: "Undo changes" },
            { text: "Other contacts" }
          ]
        },
        { icon: "settings", text: "Settings" },
        { icon: "chat_bubble", text: "Send feedback" },
        { icon: "help", text: "Help" },
        { icon: "phonelink", text: "App downloads" },
        { icon: "keyboard", text: "Go to the old version" }
      ]
    };
  },
  props: {
    source: String
  },
  mounted() {
    if (localStorage.jwt) {
      this.jwt = localStorage.jwt;
    }
  },
  methods: {
    async addSearch(newSearch) {
      this.profile = null;
      this.storeItems = null;
      this.isloading = newSearch.isloading;
      if (newSearch === "error") {
        this.showError = true;
        this.error = "Wrong query request";
      } else if (newSearch.type == "People") {
        try {
          const response = await fetch(
            process.env.VUE_APP_PSNURL + newSearch.target
          );
          const _profile = await response.json();
          if (_profile.statusCode === 500) throw _profile.message;
          this.profile = _profile;
        } catch (e) {
          this.showError = true;
          this.error = e;
        }
      } else if (newSearch.type == "Store") {
        try {
          const response = await fetch(
            `${process.env.VUE_APP_PSNURL}store/${newSearch.target}/${
              this.currentRegion.language
            }/${this.currentRegion.region}/21`
          );
          const items = await response.json();
          if (items.statusCode === 500) throw items.message;
          this.storeItems = {
            region: this.currentRegion.region,
            items: [...items]
          };
        } catch (e) {
          this.showError = true;
          this.error = e;
        }
      }
      this.isloading = false;
    },
    async changeStoreSetting() {
      const array = this.storeChange.split(":");
      this.currentRegion.language = array[0];
      this.currentRegion.region = array[1];
      this.regionDialog = false;
    },
    async gotToken(jwt) {
      this.jwt = jwt;
      localStorage.jwt = this.jwt;
    },
    async lostToken(boolean) {
      if (boolean) this.jwt = null;
    },
    gotSuccess(success) {
      this.success = success;
      this.showSuccess = true;
    }
  }
};
</script>

<style scoped>
</style>

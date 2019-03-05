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
            <v-list-tile v-for="(child, i) in item.children" :key="i" @click>
              <v-list-tile-action v-if="child.icon">
                <v-icon>{{ child.icon }}</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>{{ child.text }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list-group>
          <v-list-tile v-else :key="item.text" @click>
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
        <span class="hidden-sm-and-down">PixelShare</span>
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>apps</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>notifications</v-icon>
      </v-btn>
      <v-btn icon large>
        <v-avatar size="32px" tile>
          <img src="./assets/playstation-brands.svg" alt>
        </v-avatar>
      </v-btn>
    </v-toolbar>
    <v-content>
      <v-container @click.stop="drawer = false">
        <v-layout justify-center align-center column>
          <SearchBar v-on:addSearch="addSearch"/>

          <Loading v-if="isloading"/>
          <Profile v-bind:profile="profile"/>

          <StoreItems v-bind:storeItems="storeItems"/>
        </v-layout>
      </v-container>
    </v-content>
    <!-- <Footer /> -->
    <v-btn fab bottom right color="blue" dark fixed @click="dialog = !dialog">
      <v-icon>add</v-icon>
    </v-btn>
    <v-dialog v-model="dialog" width="800px">
      <v-card>
        <v-card-title class="grey lighten-4 py-4 title">Create contact</v-card-title>
        <v-container grid-list-sm class="pa-4">
          <v-layout row wrap>
            <v-flex xs12 align-center justify-space-between>
              <v-layout align-center>
                <v-avatar size="40px" class="mr-3">
                  <img src="//ssl.gstatic.com/s2/oz/images/sge/grey_silhouette.png" alt>
                </v-avatar>
                <v-text-field placeholder="Name"></v-text-field>
              </v-layout>
            </v-flex>
            <v-flex xs6>
              <v-text-field prepend-icon="business" placeholder="Company"></v-text-field>
            </v-flex>
            <v-flex xs6>
              <v-text-field placeholder="Job title"></v-text-field>
            </v-flex>
            <v-flex xs12>
              <v-text-field prepend-icon="mail" placeholder="Email"></v-text-field>
            </v-flex>
            <v-flex xs12>
              <v-text-field
                type="tel"
                prepend-icon="phone"
                placeholder="(000) 000 - 0000"
                mask="phone"
              ></v-text-field>
            </v-flex>
            <v-flex xs12>
              <v-text-field prepend-icon="notes" placeholder="Notes"></v-text-field>
            </v-flex>
          </v-layout>
        </v-container>
        <v-card-actions>
          <v-btn flat color="primary">More</v-btn>
          <v-spacer></v-spacer>
          <v-btn flat color="primary" @click="dialog = false">Cancel</v-btn>
          <v-btn flat @click="dialog = false">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import Profile from "./components/Profile";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import StoreItems from "./components/StoreItems";
import Footer from "./components/Footer";
import Loading from "./components/Loading";

export default {
  name: "app",
  components: {
    Header,
    Profile,
    StoreItems,
    SearchBar,
    Loading,
    Footer
  },
  data() {
    return {
      profile: {},
      storeItems: [],
      isloading: false,
      dialog: false,
      drawer: false,
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
  methods: {
    async addSearch(newSearch) {
      this.isloading = newSearch.isloading;
      this.profile = {};
      this.storeItems = [];
      if (newSearch.type == "People") {
        const response = await fetch(
          process.env.VUE_APP_PSNURL + newSearch.target
        );
        this.profile = await response.json();
      } else if (newSearch.type == "Store") {
        const response = await fetch(
          process.env.VUE_APP_PSNURL + "store/" + newSearch.target + "/en/US/21"
        );
        const items = await response.json();
        this.storeItems = [...items];
      }
      this.isloading = false;
    }
  }
};
</script>

<style scoped>
.searchbar {
  margin: 0;
}
</style>

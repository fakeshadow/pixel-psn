<template>
  <div class="text-xs-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="true"
      :nudge-width="200"
      transition="slide-x-transition"
      bottom
      left
      offset-x
    >
      <template v-slot:activator="{ on }">
        <v-btn icon large v-on="on">
          <v-avatar size="32px" tile>
            <img v-if="!profile.avatarUrl" src="../assets/playstation-brands.svg">
            <img v-if="profile.avatarUrl" v-bind:src="profile.avatarUrl">
          </v-avatar>
        </v-btn>
      </template>

      <v-card>
        <v-list>
          <v-list-tile avatar>
            <v-list-tile-avatar>
              <img v-if="profile.avatarUrl" v-bind:src="profile.avatarUrl">
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>{{profile.onlineId}}</v-list-tile-title>
              <v-list-tile-sub-title>{{username}}</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>

        <v-divider></v-divider>
        <v-list>
          <v-list-tile @click="openLinkPSNDialog" v-if="profile.onlineId =='not linked'">
            <v-dialog v-model="linkPSNDialog" max-width="300">
              <v-card>
                <v-layout row wrap justify-center text-xs-center>
                  <v-flex xs12>
                    <v-card-text text-xs-center>
                      <v-text-field v-model="linkingPSNId" label="Your PSN ID" solo></v-text-field>
                      <h3
                        class="red--text"
                      >Please change your "About Me" comment in the PSN account settings to the exact match of the following code before continue:</h3>
                      <v-text-field
                        class="centered-input"
                        v-model="linkingCode"
                        solo
                        readonly
                        :autofocus="true"
                        dark
                      ></v-text-field>
                    </v-card-text>
                  </v-flex>
                  <v-flex xs12>
                    <v-alert
                      :value="showError"
                      type="error"
                      dismissible
                      @click="showError = !showError"
                    >{{this.error}}</v-alert>
                  </v-flex>
                  <v-card-actions>
                    <v-btn
                      :loading="isLoading"
                      :disabled="isLoading"
                      @click="linkingPSN"
                      Raised
                    >Confirm</v-btn>
                  </v-card-actions>
                </v-layout>
              </v-card>
            </v-dialog>
            <v-list-tile-avatar>
              <v-icon>link</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-title>Link Your PSNID</v-list-tile-title>
          </v-list-tile>

          <v-list-tile @click="logout">
            <v-list-tile-avatar>
              <v-icon>account_box</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-title>My Page</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="logout">
            <v-list-tile-avatar>
              <v-icon>settings</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-title>Settings</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="logout">
            <v-list-tile-avatar>
              <v-icon>exit_to_app</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-title>Logout</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: "UserMenu",
  data: () => ({
    menu: false,
    profile: {
      onlineId: "not linked",
      avatarUrl: null
    },
    username: 'No user found',
    linkPSNDialog: false,
    linkingPSNId: null,
    linkingCode: null,
    isLoading: false,
    showError: false,
    error: null
  }),
  async mounted() {
    if (localStorage.onlineId) {
      const onlineId = localStorage.onlineId;
      const response = await fetch(process.env.VUE_APP_PSNURL + onlineId);
      this.profile = await response.json();
    }
    if (localStorage.username) {
      this.username = localStorage.username;
    }
  },
  methods: {
    openLinkPSNDialog() {
      this.linkPSNDialog = true;
      this.menu = false;
      let text = "";
      const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      this.linkingCode = text;
    },
    logout() {
      localStorage.removeItem("jwt");
      localStorage.removeItem("onlineId");
      localStorage.removeItem("username");
      this.$emit("lostToken", true);
    },
    async linkingPSN() {
      try {
        this.isLoading = true;
        const response = await fetch(
          process.env.VUE_APP_PSNURL + this.linkingPSNId
        );
        const profile = await response.json();
        if (!profile.aboutMe) throw new Error("No profile data found");
        if (profile.aboutMe !== this.linkingCode)
          throw new Error("The linking code doesn't match");
        this.profile = profile;
        localStorage.onlineId = profile.onlineId;
        this.isLoading = false;
      } catch (e) {
        this.showError = true;
        this.isLoading = false;
        this.error = e;
      }
    }
  }
};
</script>

<style scoped>
.centered-input {
  text-align: center;
}
</style>

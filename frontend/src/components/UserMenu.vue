<template>
  <v-layout row text-xs-center justify-end>
    <v-dialog v-model="sendMessageDialog" max-width="400">
      <v-card>
        <v-layout row wrap justify-center text-xs-center>
          <v-flex xs12>
            <v-card-text text-xs-center>
              <v-text-field v-model="messageTargetId" label="Send to (PSNID): "></v-text-field>
              <v-textarea v-model="messageContent" color="teal">
                <template v-slot:label>
                  <div>Message:</div>
                </template>
              </v-textarea>

              <div v-if="!image">
                <h4>Please select an image if you want to send image message</h4>
                <input type="file" @change="onFileChange">
              </div>
              <div v-else>
                <img :src="image" width="300">
                <v-btn @click="removeImage">Remove image</v-btn>
              </div>
            </v-card-text>
          </v-flex>
          <v-flex xs12>
            <v-alert
              :value="showError"
              type="error"
              dismissible
              transition="scale-transition"
              @click="showError = !showError"
            >{{this.error}}</v-alert>
          </v-flex>
          <v-card-actions>
            <v-btn :loading="isLoading" :disabled="isLoading" @click="sendMessage" Raised>Confirm</v-btn>
          </v-card-actions>
        </v-layout>
      </v-card>
    </v-dialog>
    <v-menu
      v-model="messageMenu"
      :close-on-content-click="true"
      :nudge-width="300"
      transition="slide-x-transition"
      bottom
      left
      offset-x
    >
      <template v-slot:activator="{ on }">
        <v-btn icon large v-on="on">
          <v-icon>notifications</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-card-actions>
          <v-btn @click="openSendMessageDialog">
            <v-icon>send</v-icon>Send Message
          </v-btn>
        </v-card-actions>
        <v-divider></v-divider>
        <v-card-title>Notifications</v-card-title>
        <v-list v-bind:key="index" v-for="(message,index) in messages">
          <v-list-tile avatar>
            <v-list-tile-avatar>
              <img src="../assets/playstation-brands.svg">
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{message.message}}</v-list-tile-title>
              <v-list-tile-sub-title>{{message.onlineId}}</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-card>
    </v-menu>
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
                      transition="scale-transition"
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

          <v-list-tile @click="logout" v-if="profile.onlineId !=='not linked'">
            <v-list-tile-avatar>
              <v-icon>account_box</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-title>My Page</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="logout" v-if="profile.onlineId !=='not linked'">
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
  </v-layout>
</template>

<script>
export default {
  name: "UserMenu",
  data: () => ({
    menu: false,
    messageMenu: false,
    profile: {
      onlineId: "not linked",
      avatarUrl: null
    },
    username: "No user found",
    linkPSNDialog: false,
    sendMessageDialog: false,
    linkingPSNId: null,
    linkingCode: null,
    isLoading: false,
    showError: false,
    showBottomAlert: false,
    error: null,
    messages: [
      { onlineId: "placeholder1", message: "placeholder1 message" },
      { onlineId: "placeholder2", message: "placeholder2 message" },
      { onlineId: "placeholder3", message: "placeholder3 message" }
    ],
    image: "",
    messageTargetId: null,
    messageContent: null
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
    openSendMessageDialog() {
      this.sendMessageDialog = true;
    },
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
        // if (profile.aboutMe !== this.linkingCode)
        //   throw new Error("The linking code doesn't match");
        this.profile = profile;
        localStorage.onlineId = profile.onlineId;
        this.isLoading = false;
      } catch (e) {
        this.showError = true;
        this.isLoading = false;
        this.error = e;
      }
    },
    async sendMessage(e) {
      try {
        e.preventDefault();
        this.isLoading = true;
        if (this.messageTargetId == null || this.messageContent == null)
          throw new Error("Blank content or target id");

        const formData = new FormData();
        formData.append("onlineId", this.messageTargetId);
        formData.append("message", this.messageContent);

        if (this.image !== "") {
          formData.append("image", this.image);
        }
        await fetch(process.env.VUE_APP_PSNURL + "message", {
          method: "post",
          body: formData,
          compress: true
        });
        this.isLoading = false;
        this.messageTargetId = null;
        this.messageContent = null;
        this.image = "";
        this.sendMessageDialog = false;
        this.$emit("gotSuccess", "Message Sent");
      } catch (err) {
        this.showError = true;
        this.isLoading = false;
        this.error = err;
      }
    },
    onFileChange(e) {
      this.showError = false;
      const files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      if (files[0].size >= 999999) {
        this.error =
          "Image file too big. Please reduce the size to less than 1mb";
        this.showError = true;
        return;
      }
      this.createImage(files[0]);
    },
    createImage(file) {
      const reader = new FileReader();

      reader.onload = e => {
        this.image = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    removeImage() {
      this.image = "";
    }
  }
};
</script>

<style scoped>
.centered-input {
  text-align: center;
}
</style>

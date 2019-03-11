<template>
  <v-container fluid>
    <v-layout row wrap justify-center>
      <v-flex xs12 sm10 md8 lg5>
        <v-tabs v-model="active" slider-color="black" fixed-tabs>
          <v-tab
            v-for="n in tabs.length"
            :key="n"
            ripple
            light
            @click="getData(tabs[n - 1])"
          >{{ tabs[n - 1] }}</v-tab>
          <v-tab-item v-for="n in tabs.length" :key="n">
            <template v-for="(d, index) in data">
              <v-card class="mx-auto" :key="index" light max-width="100%">
                <v-card-title>
                  <v-list-tile class="grow">
                    <v-list-tile-avatar>
                      <v-img v-if="d.avatar" class="elevation-6" v-bind:src="d.avatar"></v-img>
                      <img v-else src="../assets/playstation-brands.svg">
                    </v-list-tile-avatar>

                    <v-list-tile-content>
                      <v-list-tile-title class="title font-weight-medium">{{d.uid}}</v-list-tile-title>
                      <v-list-tile-sub-title class="subheading font-weight-thin">
                        <timeago :datetime="d.lastPostTime" :auto-update="60"></timeago>
                      </v-list-tile-sub-title>
                    </v-list-tile-content>
                    <v-list-tile-action-text class="subheading mr-2"></v-list-tile-action-text>
                  </v-list-tile>
                </v-card-title>

                <v-layout row justify-center>
                  <v-flex xs1></v-flex>
                  <v-flex xs11 >
                    <v-text class="title font-weight-bold" @click="show">
                      <div class="postContent" v-ripple>{{d.postContent}}</div>
                    </v-text>
                  </v-flex>
                </v-layout>

                <v-card-actions>
                  <v-layout row wrap justify-end>
                    <v-flex xs2 xl1 mt-3>
                      <v-chip small outline>
                        {{d.postCount}}
                        <v-icon right>reply</v-icon>
                      </v-chip>
                    </v-flex>
                    <v-flex xs2 xl1 mt-3>
                      <v-chip small outline>
                        {{d.postCount}}
                        <v-icon right>thumb_up</v-icon>
                      </v-chip>
                    </v-flex>
                  </v-layout>
                </v-card-actions>
              </v-card>
              <v-divider :key="index"></v-divider>
            </template>
          </v-tab-item>
        </v-tabs>
      </v-flex>
    </v-layout>
  </v-container>
</template>
            

<script>
import Loading from "@/components/Loading";

export default {
  name: "talk",
  components: {
    Loading
  },
  data() {
    return {
      tabs: ["general", "games", "other"],
      isLoading: false,
      data: [],
      active: 0,
      firstPage: 9999999999
    };
  },
  async mounted() {
    this.isLoading = true;
    const response = await fetch(
      process.env.VUE_APP_POSTURL + `${this.tabs[0]}/${this.firstPage}`
    );
    const json = await response.json();
    this.data = json;
    this.isLoading = false;
  },
  methods: {
    async getData(tabName) {
      this.isLoading = true;
      const response = await fetch(
        process.env.VUE_APP_POSTURL + `${tabName}/${this.firstPage}`
      );
      const json = await response.json();

      this.data = json;
      this.isLoading = false;
    },
    show() {
      console.log("???");
    }
  }
};
</script>

<style scoped>
.postContent {
  text-align-last: auto;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>


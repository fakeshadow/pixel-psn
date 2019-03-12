<template>
  <v-container fluid>
    <v-layout row wrap justify-center>
      <v-speed-dial fixed bottom right fab :direction="top" :transition="transition">
        <template v-slot:activator>
          <v-btn color="blue darken-2" dark fab to="/addpost" v-ripple>
            <v-icon>create</v-icon>
          </v-btn>
        </template>
      </v-speed-dial>
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
              <v-container :key="index" pa-1>
                <v-card light max-width="100%" hover>
                  <v-card-title>
                    <v-layout row wrap>
                      <v-flex xs3 sm2 xl1>
                        <v-menu
                          :close-on-content-click="true"
                          :nudge-width="300"
                          transition="slide-x-transition"
                          bottom
                          left
                          offset-x
                        >
                          <template v-slot:activator="{ on }">
                            <v-avatar @click="showUserDetail(d.uid)" v-ripple v-on="on" contain>
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/e/e8/CandymyloveYasu.png"
                              >
                            </v-avatar>
                          </template>
                          <v-card>
                            <v-img :src="cards[0].src" height="200px">
                              <v-container fill-height fluid pa-2>
                                <v-layout fill-height>
                                  <v-flex xs12 align-end flexbox>
                                    <span class="headline white--text" v-text="cards[0].title"></span>
                                  </v-flex>
                                  <v-flex xs12 align-end flexbox>
                                    <v-btn icon>
                                      <v-icon>favorite</v-icon>
                                    </v-btn>
                                  </v-flex>
                                </v-layout>
                              </v-container>
                            </v-img>
                          </v-card>
                        </v-menu>
                      </v-flex>
                      <v-flex xs9 sm10 xl11>
                        <v-list-tile-content>
                          <v-list-tile-title class="title font-weight-black">{{d.uid}}</v-list-tile-title>
                          <v-list-tile-sub-title class="subheading font-weight-thin">
                            <timeago :datetime="d.lastPostTime" :auto-update="60"></timeago>
                          </v-list-tile-sub-title>
                        </v-list-tile-content>
                      </v-flex>
                      <v-flex xs0 sm2 xl1 mt-3></v-flex>
                      <v-flex xs12 sm10 xl11 mt-3>
                        <v-text
                          class="title font-weight-regular"
                          @click="showPostsDetail(d.mainPid)"
                        >
                          <div class="postContent" v-ripple>{{d.postContent}}</div>
                        </v-text>
                      </v-flex>
                    </v-layout>
                  </v-card-title>

                  <v-card-actions>
                    <v-layout row wrap justify-end>
                      <v-flex xs3 sm2 xl1>
                        <v-chip small outline @click="showPostsDetail(d.mainPid)" v-ripple>
                          {{d.postCount}}
                          <v-icon right>reply</v-icon>
                        </v-chip>
                      </v-flex>
                      <v-flex xs3 sm2 xl1>
                        <v-chip small outline>
                          {{d.postCount}}
                          <v-icon right>thumb_up</v-icon>
                        </v-chip>
                      </v-flex>
                    </v-layout>
                  </v-card-actions>
                </v-card>
              </v-container>
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
      userDetailMenu: false,
      isLoading: false,
      data: [],
      active: 0,
      firstPage: 9999999999,
      cards: [
        {
          title: "Pre-fab homes",
          src: "https://cdn.vuetifyjs.com/images/cards/house.jpg",
          flex: 12
        },
        {
          title: "Favorite road trips",
          src: "https://cdn.vuetifyjs.com/images/cards/road.jpg",
          flex: 6
        },
        {
          title: "Best airlines",
          src: "https://cdn.vuetifyjs.com/images/cards/plane.jpg",
          flex: 6
        }
      ]
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
    async showUserDetail(uid) {
      this.userDetailMenu = true;
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


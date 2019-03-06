<template>
  <div id="app">
    <Header/>
    <SearchBar class="searchbar" v-on:addSearch="addSearch"/>

    <Profile v-bind:profile="profile"/>
    <StoreItems v-bind:storeItems="storeItems"/>
  </div>
</template>

<script>
import Profile from "./components/Profile";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import StoreItems from "./components/StoreItems";

export default {
  name: "app",
  components: {
    Header,
    Profile,
    StoreItems,
    SearchBar
  },
  data() {
    return {
      profile: {},
      storeItems: [],
      isloading: false
    };
  },
  methods: {
    async addSearch(newSearch) {
      this.isloading = newSearch.isloading;
      if (newSearch.type == "person") {
        const response = await fetch(
          process.env.VUE_APP_PSNURL + newSearch.target
        );
        return (this.profile = await response.json());
      } else if (newSearch.type == "store") {
        const response = await fetch(
          process.env.VUE_APP_PSNURL + "store/" + newSearch.target + "/en/US/21"
        );
        const items = await response.json();
        return (this.storeItems = [...items]);
      } else {
        return null;
      }
    }
  }
};
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.btn {
  display: inline-block;
  border: none;
  background: #555;
  color: #fff;
  cursor: pointer;
}
.searchbar {
  margin-top: 50px;
  padding-left: 35%;
  padding-right: 35%;
}
</style>
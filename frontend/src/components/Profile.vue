<template>
  <div>
    <h1>{{profile.onlineId}}</h1>
    <h1>{{profile.npId}}</h1>
    <h1>{{profile.aboutMe}}</h1>
    <img v-bind:src="profile.avatarUrl" />
    <h1>{{profile.languagesUsed}}</h1>
    <h1>{{profile.lastUpdateDate}}</h1>
    <h1>{{profile.plus}}</h1>
    <h1>{{profile.region}}</h1>
    <h1>{{profile.trophySummary}}</h1>
    <div v-bind:key="listItem.npCommunicationId" v-for="listItem of profile.trophyList">
      <trophy-list-item v-bind:listItem="listItem" v-bind:onlineId="profile.onlineId"/>
    </div>
  </div>
</template>

<script lang="ts">
import TrophyListItem from "./TrophyListItem.vue";

export default {
  name: "Profile",
  components: {
    TrophyListItem
  },
  props: ["profile"]
};
</script>

<style scoped>
</style>


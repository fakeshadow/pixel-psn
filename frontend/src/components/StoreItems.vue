<template>
  <div>
    <div v-bind:key="item.id" v-for="item of storeItems">
      <h1>{{item.name}}</h1>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "StoreItem",
  props: ["storeItems"],
  methods: {}
};
</script>

<style scoped>
</style>
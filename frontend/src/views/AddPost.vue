<template>
  <v-container>
    <v-layout justify-center>
      <v-flex xs12 sm10 md8 lg6>
        <v-card hover>
          <ckeditor :editor="editor" v-model="editorData" :config="editorConfig"></ckeditor>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import BallonEditor from "@ckeditor/ckeditor5-build-balloon";

export default {
  name: "addpost",
  components: {
    BallonEditor
  },
  data() {
    return {
      editor: BallonEditor,
      editorData: "<p>Please start input here.</p>",
      editorConfig: {}
    };
  },
  mounted() {},
  beforeDestroy() {
    this.editor.distroy();
  }
};
</script>

<style scoped>
</style>


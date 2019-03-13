<template>
  <v-container>
    <v-layout justify-center>
      <v-flex xs12 sm10 md8 lg5>
        <v-card hover>
          <ckeditor :editor="editor" v-model="editorData" :config="editorConfig"></ckeditor>
          <v-divider></v-divider>
          <v-card-action>
            <v-btn flat>Clear</v-btn>
            <v-spacer></v-spacer>
            <v-btn flat @click="addPost">Submit</v-btn>
          </v-card-action>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export default {
  name: "addpost",
  components: {
    ClassicEditor
  },
  data() {
    return {
      editor: ClassicEditor,
      editorData: "",
      editorConfig: {
        placeholder: "Have fun posting"
      }
    };
  },
  mounted() {},
  beforeDestroy() {
    this.editor.distroy();
  },
  methods: {
    async addPost() {
      try {
        if (this.editorData.length < 8) throw new Error("Post too short.");
        if (this.editorData.length > 255)
          throw new Error("Max post length is 255.");

        const body = {
          uid: "blue_GC",
          avatar:
            "https://upload.wikimedia.org/wikipedia/commons/e/e8/CandymyloveYasu.png",
          cid: "general",
          toPid: 0,
          postContent: this.editorData
        };
        await fetch(process.env.VUE_APP_POSTURL, {
          method: "post",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" }
        });
      } catch (e) {
        this.$emit("gotSnack", { error: e });
      }
    }
  }
};
</script>

<style scoped>
</style>


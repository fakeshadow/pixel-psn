<template>
  <div class="text-xs-center">
    <v-menu v-model="menu" :close-on-content-click="false" :nudge-width="200" offset-x>
      <template v-slot:activator="{ on }">
        <v-btn icon large v-on="on">
          <v-avatar size="32px" tile>
            <img src="../assets/playstation-brands.svg">
          </v-avatar>
        </v-btn>
      </template>

      <v-card>
        <v-list>
          <v-list-tile avatar>
            <v-list-tile-avatar>
              <img src="../assets/logo.svg">
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>PSN ID</v-list-tile-title>
              <v-list-tile-sub-title>User Name</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>

        <v-divider></v-divider>
        <v-list>
          <v-list-tile>
            <v-list-tile-action>
              <v-icon>notifications</v-icon>
            </v-list-tile-action>
            <v-list-tile-title>Link Your PSNID</v-list-tile-title>
          </v-list-tile>

          <v-list-tile>
            <v-list-tile-action>
              <v-icon>notifications</v-icon>
            </v-list-tile-action>
            <v-list-tile-title>My Page</v-list-tile-title>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-action>
              <v-icon>notifications</v-icon>
            </v-list-tile-action>
            <v-list-tile-title>Settings</v-list-tile-title>
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
  })
};
</script>
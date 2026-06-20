<template>
  <div class="lobby-header">
    <span>AVAL</span>
    <span class="lobby-header-on">ON</span>
    <span class="lobby-header-line">line</span>
  </div>
</template>

<style scoped lang="scss">
.lobby-header {
  font-family: 'Overt', sans-serif;
  font-size: $font-xxxl;
  font-weight: bold;
  color: $text-primary;
  text-align: center;
}

.lobby-header-on {
  color: $accent;
}

.lobby-header-line {
  color: $accent;
  font-size: $font-lg;
}
</style>

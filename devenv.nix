{pkgs, ...}: {
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    lsp.enable = false;

    pnpm = {
      enable = true;
      package = pkgs.pnpm_11.override {nodejs-slim = pkgs.nodejs_24;};
    };
  };

  packages = [pkgs.sqlite];

  scripts.wrangler = {
    exec = ''
      exec pnpm --dir "$DEVENV_ROOT/apps/matchmaker" exec wrangler "$@"
    '';
    description = "Run the matchmaker workspace's pinned Wrangler CLI";
  };
}

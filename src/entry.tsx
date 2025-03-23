import { render } from "@canva/preview";
import { AppUiProvider } from "@canva/app-ui-kit";
import { App } from "./app";

render(() => (
  <AppUiProvider>
    <App />
  </AppUiProvider>
));

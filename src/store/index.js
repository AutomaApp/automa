import { createStore } from 'vuex';
import vuexORM from '@/lib/vuex-orm';
import * as models from '@/models';

const store = createStore({
  plugins: [vuexORM(models)],
});

export default store;

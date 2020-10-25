/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable fsd/hof-name-prefix */
type Listener<T> = (state: T) => void;

type Action = {
  type: string;
  value: any;
};

type Plugin<T> = (state: T) => T;

type Reducer<TState> = (action: Action, state: TState) => TState;

type Store<TState> = {
  dispatch: (action: Action) => void;
  getState: () => TState;
  subscribe: (listener: Listener<TState>) => () => void;
  coldStart: () => void;
};

type Validator = (action: Action) => Action;

function createStore<TState>(
  initState: TState,
  reducer: Reducer<TState>,
  plugins: {
    pre?: Plugin<TState>[];
    post?: Plugin<TState>[];
  } = {},
  validators: Validator[] = [],
): Store<TState> {
  const listeners: Listener<TState>[] = [];
  let _state =
    plugins.pre?.reduce((state, plugin) => plugin(state), initState) ||
    initState;

  const setNextState = (nextState: TState) => {
    for (const plugin of plugins.post || []) {
      nextState = plugin(nextState);
    }
    _state = nextState;
  };

  const getState = () => {
    return _state;
  };

  const dispatch = (action: Action) => {
    const prevState = getState();
    const validatedAction = validators.reduce(
      (action, validator) => validator(action),
      action,
    );
    setNextState(reducer(validatedAction, prevState));
    listeners.forEach(listener => listener(getState()));
  };

  const subscribe = (listener: Listener<TState>) => {
    const index = listeners.push(listener) - 1;
    listener(getState());
    // unsubscribe
    return () => listeners.splice(index, 1);
  };

  const coldStart = () => {
    dispatch({ type: '@COLD_START', value: null });
  };

  return { dispatch, getState, subscribe, coldStart };
}

function loadFromLocalStoragePlugin<T>(key: string): Plugin<T> {
  return (initState: T) => {
    return JSON.parse(window.localStorage.getItem(key) as string) || initState;
  };
}

function saveToLocalStoragePlugin<T>(key: string): Plugin<T> {
  return (state: T) => {
    window.localStorage.setItem(key, JSON.stringify(state));
    return state;
  };
}

function NaNValidator(action: Action): Action {
  if (typeof action.value === 'number') {
    if (isNaN(action.value)) {
      return {
        type: '@NAN_VALIDATOR_CATCH',
        value: {
          from: action.type,
        },
      };
    }
  }

  return action;
}

export {
  Listener,
  Action,
  Reducer,
  Store,
  Plugin,
  Validator,
  createStore,
  loadFromLocalStoragePlugin,
  saveToLocalStoragePlugin,
  NaNValidator,
};

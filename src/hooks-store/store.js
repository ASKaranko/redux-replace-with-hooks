import {useState, useEffect} from 'react';

let globalState = {};
let listeners = [];
let actions = {};

// Так как custom hook содержит useState, то компонент, который будет
// содержать custom hook, будет обновляться соответственно

//globalStore содержиться вне custom hook, поэтому он
// не будет пересоздаваться при rerender
// Тут очень важно понимать, что import store будет содержать
// глобальные переменные globalStore и другие, они будут одинаковыми для всех,
// если бы мы включили их в custom hook, то они были уникальными для каждого
// компонента, использующего custom hook
export const useStore = (shouldListen = true) => {
	// интересует только функция обновления
	const setState = useState(globalState)[1];
	// по сути, замена reducer и action вместе
	const dispatch = (actionIdentifier, payload) => {
		const newState = actions[actionIdentifier](globalState, payload);
		globalState = {...globalState, ...newState};

		// Обновляет компоненты, так как listener - это setState функция
		for (const listener of listeners) {
			listener(globalState);
		}
	};
	useEffect(() => {
		// shouldListen делает rerender конкретного компонента,
		// например, ProductItem, если ему это необходимо
		if (shouldListen) {
			// listeners глобальный, как только новый компонент будет использовать
			// custom hook, мы заносим это компонент в listeners
			// так как это замыкание, то функция setState не будет меняться в listeners
			// это будет как id конкретного компонента. Следует сказать, что React
			// гарантирует, что setState никогда не меняется
			listeners.push(setState);
		}
		// Убрать listener, когда компонент Will Unmount
		return () => {
			if (shouldListen) {
				listeners = listeners.filter(listener => listener !== setState);
			}
		};
	//	React гарантирует, что setState никогда не меняется,
	//	поэтому хотя это и dependencies, но будет вызвата при монтировании и размонтировании
	}, [setState, shouldListen]);

	return [globalState, dispatch];
};

export const initStore = (userActions, initialState) => {
	if (initialState) {
		// Мы как и в combineReducers в redux объединяем все reducers
		// в глобальный store и добавляем в него initialState конкретного reducer абстрактного
		globalState = {...globalState, ...initialState};
	}
	actions = {...actions, ...userActions};
};

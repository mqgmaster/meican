<?php

class Dispatcher {

	function dispatch(){
		if (!$this->login())
			return ;
		if (array_key_exists('url', $_GET))
			$url = Common::GET('url');
		else
			$url = '';
		$router = new Router(array());
		extract($router->parse($url));
		if (!empty($app)){
			Language::setLang($app);
			$app = Framework::loadApp($app);
	
			if (!empty($controller)) {
				$controller = $app->loadController($controller);
				if (!empty($action) && method_exists($controller, $action)){
				    $controller->$action(Controller::getParam($params));
				} else {
					$action = $controller->getDefaultAction();
					$controller->$action();
				}
			} else {
				$controller = $app->loadController($app->getDefaultController());

				$action = $controller->getDefaultAction();
				$controller->$action();
			}
		} else {
				$appClass = Framework::getMainApp();
				$app = Framework::loadApp($appClass);

				Language::setLang($appClass);

				$controllerClass = $app->getDefaultController();
				$controller = $app->loadController($controllerClass);

				$action = $controller->getDefaultAction();
				$controller->$action();
		}
	}

	function login(){
		if (AuthSystem::userTryToLogin() || AuthSystem::isUserLoggedIn()){
			return true;
		} else {
			/*$appClass = Common::GET('app');
            $controllerClass = Common::GET('controller');
            if (($appClass == "init") && ($controllerClass == "gui")) {
                // user has expired the session and is trying to reload the gui - refresh or F5
                // redirect to login
                header('Location: index.php?message=Session Expired');
                
            } else header('HTTP/1.1 402 Timeout');*/
			header('Location: index.php?message=Session Expired');
			return false;
		}
	}

}

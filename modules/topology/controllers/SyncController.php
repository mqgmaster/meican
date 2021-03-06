<?php

namespace meican\topology\controllers;

use yii\data\ActiveDataProvider;
use Yii;

use meican\aaa\RbacController;
use meican\topology\models\TopologySynchronizer;
use meican\topology\forms\SyncForm;
use meican\topology\components\NSIParser;
use meican\topology\models\TopologyChange;
use meican\topology\models\Service;

class SyncController extends RbacController {
    
    public function actionIndex() {
    	if(!self::can("synchronizer/read")){
			return $this->goHome();
		}
        
        $dataProvider = new ActiveDataProvider([
                'query' => TopologySynchronizer::find(),
                'pagination' => false,
                'sort' => false,
        ]);
        
        return $this->render('index', array(
                'items' => $dataProvider,
        ));
    }

    public function actionAddService($id) {
        $service = Service::findOne($id);

        if ($service) {
            $sync = new TopologySynchronizer;
            $sync->url = $service->url;
            $sync->type = $service->type;
            $sync->name = $service->getType();
            $sync->auto_apply = 0;

            if ($sync->save()) {
                Yii::$app->getSession()->addFlash("success", Yii::t("topology", "Service {name} added successfully", ['name'=>$sync->name]));
            } else {
                Yii::$app->getSession()->addFlash("error", Yii::t("topology", "Service {name} was not added", ['name'=>$sync->name]));
            }
        }

        return $this->redirect(array('index'));
    }

    public function actionExecute($id) { 
    	if(!self::can("synchronizer/read")){
    		return $this->goHome();
    	}
    	
    	$sync = TopologySynchronizer::findOne($id);
        $sync->execute();
        
        return $sync->syncEvent ? $sync->syncEvent->id : false;
    }

    public function actionCreate(){
    	if(!self::can("synchronizer/create")){
    		if(!self::can("synchronizer/read")) return $this->goHome();
    		else{
    			Yii::$app->getSession()->addFlash('warning', Yii::t('topology', 'You are not allowed to add synchronizers'));
    			return $this->redirect(array('index'));
    		}
    	}

        $sync = new SyncForm;
        
        if($sync->load($_POST)) {
            if ($sync->save()) {
                $sync->saveCron();
                Yii::$app->getSession()->addFlash("success", Yii::t("topology", "Synchronizer instance {name} added successfully", ['name'=>$sync->name]));
                return $this->redirect(array('index'));
            } else {
                foreach($sync->getErrors() as $attribute => $error) {
                    Yii::$app->getSession()->addFlash("error", $error[0]);
                }
                $sync->clearErrors();
            }
        }
        
        return $this->render('create',[
                'model' => $sync,
        ]);
    }
    
    public function actionUpdate($id){
    	if(!self::can("synchronizer/update")){
    		if(!self::can("synchronizer/read")) return $this->goHome();
    		else{
    			Yii::$app->getSession()->addFlash('warning', Yii::t('topology', 'You are not allowed to update synchronizers'));
    			return $this->redirect(array('index'));
    		}
    	}

        $sync = SyncForm::build($id);
        
        if(!$sync){
        	if(!self::can("synchronizer/read")) return $this->goHome();
        	else{
        		Yii::$app->getSession()->addFlash('warning', Yii::t('topology', 'Synchronizer not found'));
        		return $this->redirect(array('index'));
        	}
        }
        
        if($sync->load($_POST)) {
            if ($sync->save()) {
                $sync->saveCron();
                Yii::$app->getSession()->addFlash("success", Yii::t("topology", "Synchronizer instance {name} updated successfully", ['name'=>$sync->name]));
                return $this->redirect(array('index'));
            } else {
                foreach($sync->getErrors() as $attribute => $error) {
                    Yii::$app->getSession()->addFlash("error", $error[0]);
                }
                $sync->clearErrors();
            }
        }
        
        return $this->render('update',[
                'model' => $sync,
        ]);
    }
    
    public function actionDelete() {
    	if(!self::can("synchronizer/delete")){
    		Yii::$app->getSession()->addFlash('warning', Yii::t('topology', 'You are not allowed to delete synchronizers'));
    		return $this->redirect(array('index'));
    	}
        
        if(isset($_POST['delete'])){
            foreach ($_POST['delete'] as $id) {
                $sync = TopologySynchronizer::findOne($id);
                if ($sync->delete()) {
                    Yii::$app->getSession()->addFlash('success', Yii::t("topology", "Synchronizer instance {name} deleted successfully", ['name'=>$sync->name]));
                } else {
                    Yii::$app->getSession()->setFlash('error', 'Error deleting Synchronizer instance '.$sync->name);
                }
            }
        }
    
        return $this->redirect(array('index'));
    }
}

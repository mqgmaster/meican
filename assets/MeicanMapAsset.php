<?php

namespace app\assets;

use yii\web\AssetBundle;

class MeicanMapAsset extends AssetBundle
{
    public $basePath = '@webroot';
    public $baseUrl = '@web';
    
    public $js = [
        'js/google/styled.marker.js',
        'js/google/marker.clusterer.compiled.js',
        'js/maps/meican-map.js',
        'js/maps/meican-map-i18n.js'
    ];
    
    public $css = [
    ];
    
    public $depends = [
        'app\assets\GoogleMapsAsset',
        'app\assets\MeicanI18NAsset',
    ];
}

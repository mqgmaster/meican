<?php
$flow = isset($this->passedArgs->flow)?$this->passedArgs->flow:null;
$timer = isset($this->passedArgs->timer)?$this->passedArgs->timer:null;
$name = isset($this->passedArgs->res_name)?$this->passedArgs->res_name:null;

$args = $this->passedArgs;
$timers_exist = isset($args->timers) ? TRUE : FALSE;

$freq_types = array();
unset($freq);
$freq->value = "DAILY";
$freq->descr = _("Everyday");
$freq_types[] = $freq;

unset($freq);
$freq->value = "WEEKLY";
$freq->descr = _("Weekly");
$freq_types[] = $freq;

unset($freq);
$freq->value = "MONTHLY";
$freq->descr = _("Monthly");
$freq_types[] = $freq;

//<link type="text/css" rel="stylesheet" href="<?php echo $this->url(); >webroot/css/jquery-ui-1.8.13.custom.css" />
?>

<form id="reservation_add" method="POST" action="<?php echo $this->buildLink(array('action' => 'submit')); ?>">

    <?php $this->addElement('reservation_tab1'); ?>
    <div id="tabs-res" class="reservation-tabs" style="position:relative;">
	<div class="tab-overlay"> </div>
        <ul style="display:none;">
            <li><a href="#tabs-1"><?php echo htmlentities(_('Endpoints & Bandwidth')); ?></a></li>
            <li><a href="#tabs-2"><?php echo _('Timer'); ?></a></li>
            <li><a href="#tabs-3"><?php echo _('Confirmation'); ?></a></li>
        </ul>
        <div id="tabs-1">
            <?php $this->addElement('reservation_tab_endpoints'); ?>
        </div>
        <div id="tabs-2" class="tab_content">
            <?php $this->addElement('timer_form', $this->passedArgs); ?>
        </div>
        <div id="tabs-3" class="tab_content">
            <?php $this->addElement('reservation_tab_confirmation'); ?>
        </div>
        <div id="tabs-4" class="control_tab">
		    <input type="submit" id="bf"  class="ok" value="<?php echo _('Finished'); ?>"/>
		    <input type="button" id="bc1" class="cancel" value="<?php echo _('Cancel'); ?>" onClick="redir('<?php echo $this->buildLink(array("action" => "show")); ?>');"/>
		</div>
    </div>

</form>

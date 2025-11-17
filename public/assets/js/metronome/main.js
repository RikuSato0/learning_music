( function() {

    var pixi, carousel, multiSequencer, pairs, characterContainer, scale;

    // Preload assets
    // -------------------------------

    var assets = [
        
        'texture/slices_eyes.png', 

        'image/ui_congas1.svg', 
        'image/ui_congas2.svg', 
        'image/ui_congas3.svg', 

        'image/ui_drums1.svg', 
        'image/ui_drums2.svg', 
        'image/ui_drums3.svg', 

        'image/ui_pause.svg', 
        'image/ui_play.svg', 
        'image/ui_arrow.svg', 

        'image/ui_timpani1.svg', 
        'image/ui_timpani2.svg', 
        'image/ui_timpani3.svg', 

        'image/ui_woodblocks1.svg', 
        'image/ui_woodblocks2.svg', 
        'image/ui_woodblocks3.svg'

    ];

    var charAssets = [];

    for ( var i in musicbox.config ) {
        var config = musicbox.config[ i ];
        // charAssets = charAssets.concat( musicbox.Character.getAssetList( config.characterBig ) );
        charAssets = charAssets.concat( musicbox.Character.getAssetList( config.characterSmall ) );
    }

    assets = assets.concat( charAssets );

    aaf.main( {
        assets: assets,
        init: init
    } );


    // Main
    // -------------------------------

    var CHILD_WIDTH = 1900; // hacky

    function init() {

        pixi = new musicbox.EasyPIXI( { 
            fullscreen: false, 
            transparent: false, 
            width: container.offsetWidth, 
            height: 280, 
            resolution: 2,
        } );

        pairs = [];

        var pairContainers = [];
        var sequencers = [];


        // Collect character pairs and sequencers
        // -------------------------------

        for ( var key in musicbox.config ) {

            var config = musicbox.config[ key ];


            // Make character pairs
            // -------------------------------

            // var characterBig = new musicbox.Character( config.characterBig );
            var characterSmall = new musicbox.Character( config.characterSmall );

            // aaf.utils.extend( characterBig.container.position, config.characterBig.position );
            aaf.utils.extend( characterSmall.container.position, config.characterSmall.position );
            
            var pair = new musicbox.CharacterPair( characterSmall );

            // birds look weird when they look at eachother.
            if ( key === 'conga' ) {
                // pair.adoringLookTimeline.clear()
            }

            // for clicking the characters, remember which arm is which track.
            pair.armToTrackIndex = {};
            [ 'left', 'right', 'small' ].forEach( function( arm ) {
                pair.armToTrackIndex[ arm ] = config.sequencer.order.indexOf( arm );
            } );

            pairs.push( pair );



            // Make sequencers
            // -------------------------------

            var sequencerConfig = config.sequencer;

            // Turns 'right' 'left' 'small' into their respective animation methods:
            sequencerConfig.listeners = config.sequencer.order.map( function( animation ) {
                return pair[ animation ];
            } );


            var sequencer = new musicbox.Sequencer( sequencerConfig );

            pairContainers.push( pair.container );
            sequencers.push( sequencer );

        }


        // Make character carousel
        // -------------------------------

        characterContainer = new PIXI.Container();
        characterContainer.position.y = 5;

        pixi.stage.addChild( characterContainer );

        carousel = new musicbox.Carousel( {
            children: pairContainers, 
            childWidth: CHILD_WIDTH,
        } );

        characterContainer.addChild( carousel.container );


        // Make multi sequencer
        // -------------------------------

        multiSequencer = new musicbox.MultiSequencer( sequencers );
        multiSequencer.on( 'pause', function() {
            
            for ( var i = 0, l = pairs.length; i < l; i++ ) { 
                pairs[ i ].characterSmall.stopBobbing();
                // pairs[ i ].characterBig.stopBobbing();
            }

        } );

        multiSequencer.on( 'change', function( index, prev ) {
        
            var pair = pairs[ prev ];

            if ( pair ) {
                // pair.characterBig.stopBobbing();
                pair.characterSmall.stopBobbing();
            }

        } );

        // container.appendChild( multiSequencer.domElement );
        document.getElementById("multi_sequencer").appendChild(multiSequencer.domElement);


        // Get going!
        // -------------------------------

        Tone.Buffer.on( 'load', function() {

            // I hate having more async in here as that's what aaf.init is 
            // supposed to get rid of, but it don't quite work w/ Tone yet

            bindListeners();

            aaf.common.loop.add( update );
            aaf.common.loop.start();
            container.appendChild( pixi.renderer.view );

            window.parent.postMessage('loaded','*');
            window.parent.postMessage('ready','*');
            
        } );


    };

    // UI
    // -------------------------------

    function bindListeners() {

        window.addEventListener( 'touchstart', function( e ) {
            e.preventDefault();
        }, false );


        // Left right buttons


        var nextListener = new musicbox.PressListener( carousel.nextButton, next );
        var prevListener = new musicbox.PressListener( carousel.prevButton, prev );



        // Carousel panning
        // -------------------------------

        var SWIPE_THRESH = 0.2;

        var grabbedPosition;
        var dragged = false;

        var $carousel = new Hammer.Manager( pixi.renderer.view, {
            recognizers: [
                [ Hammer.Pan, { direction: Hammer.DIRECTION_HORIZONTAL, event: 'pan' } ], 
                [ Hammer.Press, { time: 5, event: 'press' } ], 
            ]
        } );

        $carousel.on( 'press', function() {
            
            dragged = false;
            
            carousel.grab();
            carousel.grabTarget = carousel.container.position.x;

            grabbedPosition = carousel.grabTarget;

        } );

        $carousel.on( 'pressup', function() {
            carousel.release();

        } );

        $carousel.on( 'panend', function( e ) {

            carousel.release();

            var delta = e.deltaX / scale;

            if ( -delta > carousel.childWidth / 2 || e.velocityX > SWIPE_THRESH ) {
                next();
            } else if ( delta > carousel.childWidth / 2 || e.velocityX < -SWIPE_THRESH ) {
                prev();
            }
            
        } );
        
        $carousel.on( 'pan', function( e ) {

            e.preventDefault();

            dragged = true;

            carousel.grabTarget = grabbedPosition + e.deltaX / scale;

        } );

        pairs.forEach( function( pair, i ) {

            var sequencer = multiSequencer.sequencers[ i ];
            var trigger = function( anim ) {
                

                // PIXI offers ontap and onclick but both are triggered
                // even if the user dragged. Gotta manage that ourselves.
                if ( i === multiSequencer.activeSequencerIndex && !dragged ) { 
                    
                    //multiSequencer.pause();

                    pair[ anim ]( 0.085 );
                    sequencer.triggerSample( pair.armToTrackIndex[ anim ] );

                }

            }

            // pair.characterBig.on( 'up', trigger );
            pair.characterSmall.on( 'up', trigger );

        } )


        // Resize
        // -------------------------------

        window.addEventListener( 'resize', resize, false );
        resize();


    }

    function resize() {

        // They layout's "native" width is 360px:
        // behaves like background-size: contain

        // lotta magic numbers in here that should be constants

        var width = Math.min( 850, container.offsetHeight, container.offsetWidth );

        var ratio = ( width / 360 );
        if (carousel.activeChildIndex == 3) scale = 0.32 * ratio;
        else  scale = 0.3 * ratio;

        pixi.setSize( container.offsetWidth, 280 * ratio );
        pixi.renderer.view.style.top = ( container.offsetHeight - 240 - pixi.height ) / 2 + 'px';


        carousel.setChildWidth( CHILD_WIDTH * ratio );
        characterContainer.position.x = container.offsetWidth / 2 - width / 2;
        characterContainer.scale.set( scale );

    }

    function next() {
        if ( carousel.activeChildIndex <= carousel.children.length - 1 ) {
            var wasPlaying = multiSequencer.playing;//Tone.Transport.state === Tone.State.Started;
            if (wasPlaying) multiSequencer.pause( );
            carousel.next();
            multiSequencer.setActiveSequencer( multiSequencer.sequencers[ carousel.activeChildIndex ] );
            resize();
            if (wasPlaying) {
                setTimeout( function( ) {
                    multiSequencer.play( );
                },50)
            }

        }
    }

    function prev() {
        if ( carousel.activeChildIndex >= 0 ) {
            var wasPlaying = multiSequencer.playing;//Tone.Transport.state === Tone.State.Started;
            if (wasPlaying) multiSequencer.pause( );
            carousel.prev();
            multiSequencer.setActiveSequencer( multiSequencer.sequencers[ carousel.activeChildIndex ] );
            resize();
            if (wasPlaying) {
                setTimeout( function( ) {
                    multiSequencer.play( );
                },50)
            }
            
        }
    }

    function update() {

        pixi.render();
        carousel.update();
        multiSequencer.update();

        for ( var i = 0, l = pairs.length; i < l; i++ ) { 

            var pair = pairs[ i ];

            var b = multiSequencer.activeSequencer.position * multiSequencer.activeSequencer.timeSignature;

            if ( multiSequencer.playing && multiSequencer.activeSequencerIndex === i ) {
                // pair.characterBig.setBob( b );
                pair.characterSmall.setBob( b + 0.075 ); // offset so they're not perfectly in sync
            }

            // pair.characterBig.update();
            pair.characterSmall.update();
            
        }

    }


} )();
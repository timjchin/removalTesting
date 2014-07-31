define(function(require, exports, module) {
  require('mocha');
  var chai = require('chai');
  var expect = chai.expect;
  var RenderNode = require('famous/core/RenderNode');
  var Surface = require('famous/core/Surface');
  var Entity = require('famous/core/Entity');
  var Modifier = require('famous/core/Modifier');
  var BFS = require('famous/search/BreadthFirstSearch');
  var Timer = require('famous/utilities/Timer');

  var Engine = require('famous/core/Engine');
  var View = require('famous/core/View');
  var Modifier = require('famous/core/Modifier');
  var Transform = require('famous/core/Transform');
  var ElementOutput = require('famous/core/ElementOutput');
  var ImageSurface = require('famous/surfaces/ImageSurface');

  var mainContext = window.context = Engine.createContext();

  mocha.setup('bdd');
  chai.should();
  
  /*
   * Helper generation functions
   */
  function addSurface (node) {
    return node.add(new Surface());
  }

  function addModifierSurface (node) {
    return node.add(new Modifier()).add(new Surface());
  }

  function addMultipleChildren (node, modifierNum) {
    var childNode = node.add(new Modifier());
    var len = Math.floor(Math.random() * modifierNum) + 1;
    for (var i = 0; i < len; i++) {
      if (Math.random() > 0.5) {
        addModifierSurface(childNode);
      } else { 
        addSurface(childNode);
      }
    };
    return childNode;
  }

  function shallowTree () {
    var node = new RenderNode();
    addModifierSurface(node);
    addSurface(node);
    addMultipleChildren(node);
    return node;
  }

  function generateVisibleSurface () {
    return new Surface({ 
      properties: { 
        backgroundColor: '#fa5c4f'
      },
      classes: ['backfaceVisiblity', 'uniqueClass'],
      size: [50,50]
    });
  }

  describe('BFS', function () {
    describe('one level', function () {

      it('should find a single level surface', function () {
        var node = shallowTree();
        var surfaceToFind = new Surface();
        node.add(surfaceToFind);
        var search = BFS(node, surfaceToFind);
        expect(search._object.id).to.equal(surfaceToFind.id);
      });

      it('should find a single level modifier', function () {
        var node = shallowTree();
        var toFind = new Modifier();
        node.add(toFind);
        var search = BFS(node, toFind);
        expect(search._object).to.equal(toFind);
      });

      it('shouldn\'t find a node not included in the tree', function () {
        var node = shallowTree();
        var toFind = new Surface();
        var search = BFS(node, toFind);
        expect(search).to.equal(undefined);
      });

      it('should find a surface inside of a view', function () {
        var node = shallowTree();

        var mainView = new View();
        var toFind = new Surface();
        
        mainView.add(toFind);
        node.add(mainView);
        
        var search = BFS(node, toFind);
        expect(search._object).to.equal(toFind);
      });

      it('should find a surface inside of a view inside of a view', function () {
        var node = shallowTree();

        var mainView = new View();
        var childView = new View();
        var toFind = new Surface();
        
        mainView.add(childView);
        childView.add(toFind);
        node.add(mainView);
        
        var search = BFS(node, toFind);
        expect(search._object).to.equal(toFind);
      });
      it('should find a surface inside of a view inside of a view...', function () {
        var node = shallowTree();

        var mainView = new View();
        var toFind = new Surface();

        var lastView;
        var firstView;
        for (var i = 0; i < 10; i++) {
          var nestedView = new View();
          if (i == 0) firstView = nestedView;
          if (lastView) lastView.add(nestedView);
          lastView = nestedView;
        };
        mainView.add(firstView);
        lastView.add(toFind);
        
        node.add(mainView);
        
        var search = BFS(node, toFind);
        expect(search._object).to.equal(toFind);
      }); 

    });

    describe('deep level', function () {

      it('should find a nested surface.', function () {
        var node = shallowTree();
        var childNode = addMultipleChildren(node);

        var surfaceToFind = new Surface();
        childNode.add(surfaceToFind);

        var search = BFS(node, surfaceToFind);
        expect(search._object.id).to.equal(surfaceToFind.id);
      });

      it('should find a nested modifier.', function () {
        var node = shallowTree();
        var childNode = addMultipleChildren(node);

        var modifierToFind = new Modifier();
        childNode.add(modifierToFind);

        var search = BFS(node, modifierToFind);
        expect(search._object).to.equal(modifierToFind);
      });
    });
  });

  describe('Removal ', function () {
    it('should remove a nested surface.', function () {
      var node = shallowTree();
      var childNode = addMultipleChildren(node);
      var surfaceToFind = new Surface();
      childNode.add(surfaceToFind);
      node.remove(surfaceToFind);
      expect(BFS(node, surfaceToFind)).to.equal(undefined);
    });

    it('should unregister a nested surface from Entity.', function () {
      var node = shallowTree();
      var childNode = addMultipleChildren(node);
      var surfaceToFind = new Surface();
      childNode.add(surfaceToFind);
      node.remove(surfaceToFind);
      expect(Entity.get(surfaceToFind.id)).to.equal(null);
    });

    it('should remove a portion of the render tree.', function () {
      var node = shallowTree();
      var childNode = addMultipleChildren(node);
      var surfaceToFind = new Surface();
      var modifierToFind = new Modifier();
      childNode.add(modifierToFind).add(surfaceToFind);
      node.remove(modifierToFind);
      expect(BFS(node, surfaceToFind)).to.equal(undefined);
    });

    
    it('should remove a portion of the render tree inside of a view.', function () {
      var node = shallowTree();
      var childNode = addMultipleChildren(node);

      var surfaceToFind = new Surface();
      //var surfaceToFind2 = new Surface();
      
      var viewToFind = new View();
      childNode.add(viewToFind);

      viewToFind.add(surfaceToFind);
      node.remove(viewToFind);

      expect(BFS(node, surfaceToFind)).to.equal(undefined);
      expect(Entity.get(surfaceToFind.id)).to.equal(null);
      
    });

    function createSurfaces () {
      var surfaceToFind = new Surface();
      var surfaceToFind2 = new Surface();
      var surfaceToFind3 = new Surface();

      var checkRemoved = (function (surfaces, node) {
        expect(BFS(node, surfaces[0])).to.equal(undefined);
        expect(BFS(node, surfaces[1])).to.equal(undefined);
        expect(BFS(node, surfaces[2])).to.equal(undefined);
        
        expect(Entity.get(surfaces[0].id)).to.equal(null);
        expect(Entity.get(surfaces[1].id)).to.equal(null);
        expect(Entity.get(surfaces[2].id)).to.equal(null);
      }).bind(null, [surfaceToFind, surfaceToFind2, surfaceToFind3]);

      return {
        surfaces: [ surfaceToFind, surfaceToFind2, surfaceToFind3],
        removeCheck: checkRemoved
      }
    }

    it('should remove a portion of the render tree inside of a view. Multiple surfaces', function () {
      var node = shallowTree();
      var childNode = addMultipleChildren(node);
      var content = createSurfaces();
      
      var viewToFind = new View();
      childNode.add(viewToFind);

      viewToFind.add(content.surfaces[0]);
      viewToFind.add(content.surfaces[1]);
      viewToFind.add(content.surfaces[2]);
      
      node.remove(viewToFind);
      content.removeCheck(node);
    });
    
    it('should remove a portion of the render tree inside of a view. Multiple surfaces, nested Views.', function () {
      var node = shallowTree();
      var childNode = addMultipleChildren(node);

      var content = createSurfaces();

      var viewToFind = new View();
      var nestedView = new View();
      
      childNode.add(viewToFind);
      viewToFind.add(nestedView);

      nestedView.add(content.surfaces[0]);
      nestedView.add(content.surfaces[1]);
      nestedView.add(content.surfaces[2]);
      
      node.remove(viewToFind);
      content.removeCheck(node);
    });

    it('should unregister the portions of the render tree that were removed.', function () {
      var node = shallowTree();
      var childNode = addMultipleChildren(node);

      var surfaceToFind = new Surface();
      var surfaceToFind2 = new Surface();
      
      var modifierToFind = new Modifier();
      var nestedNode = childNode.add(modifierToFind);
      nestedNode.add(surfaceToFind);
      nestedNode.add(surfaceToFind2);
      
      node.remove(modifierToFind);

      expect(Entity.get(surfaceToFind.id)).to.equal(null);
      expect(Entity.get(surfaceToFind2.id)).to.equal(null);
    });
  });

  describe('Remove From Live Famo.us', function () {

     it('should remove a surface.', function (done) {
        // your app here
        var initialTime = Date.now();
        var centerSpinModifier = new Modifier({
            origin: [0.5, 0.5],
            transform : function(){
                return Transform.rotateY(.0001 * (Date.now() - initialTime));
            }
        });

        var surfaceToFind = generateVisibleSurface();

        mainContext.add(centerSpinModifier).add(surfaceToFind);

        Timer.setTimeout(function () {
          mainContext.remove(centerSpinModifier);
          var search = BFS(mainContext._node, surfaceToFind);
          expect(search).to.equal(undefined);

          var inTheDOM = document.getElementsByClassName('uniqueClass');
          expect(inTheDOM.length).to.equal(0);

          done();
        }, 50);
    });

     it('should remove a portion of the render tree.', function (done) {
        // your app here
        var initialTime = Date.now();
        var centerSpinModifier = new Modifier({
            origin: [0.5, 0.5],
            transform : function(){
                return Transform.rotateY(.0001 * (Date.now() - initialTime));
            }
        });


        var childNode = mainContext.add(centerSpinModifier);
        var surfaceToFind = generateVisibleSurface();
        var surfaceToFind2 = generateVisibleSurface();
        
        childNode.add(surfaceToFind);
        childNode.add(new Modifier({ transform: Transform.translate(0, 50) })).add(surfaceToFind2);

        Timer.setTimeout(function () {
          mainContext.remove(centerSpinModifier);

          var search = BFS(mainContext._node, surfaceToFind);
          expect(search).to.equal(undefined);
          
          var search = BFS(mainContext._node, surfaceToFind2);
          expect(search).to.equal(undefined);

          var inTheDOM = document.getElementsByClassName('uniqueClass');
          expect(inTheDOM.length).to.equal(0);
          
          done();
        }, 50);
    });

    it('should remove a portion of the render tree.', function (done) {
        // your app here
        var initialTime = Date.now();
        var centerSpinModifier = new Modifier({
            origin: [0.5, 0.5],
            transform : function(){
                return Transform.rotateY(.0001 * (Date.now() - initialTime));
            }
        });


        var childNode = mainContext.add(centerSpinModifier);
        var surfaceToFind = generateVisibleSurface();
        var surfaceToFind2 = generateVisibleSurface();
        
        childNode.add(surfaceToFind);
        childNode.add(new Modifier({ transform: Transform.translate(0, 50) })).add(surfaceToFind2);

        Timer.setTimeout(function () {
          mainContext.remove(centerSpinModifier);

          var search = BFS(mainContext._node, surfaceToFind);
          expect(search).to.equal(undefined);
          
          var search = BFS(mainContext._node, surfaceToFind2);
          expect(search).to.equal(undefined);

          var inTheDOM = document.getElementsByClassName('uniqueClass');
          expect(inTheDOM.length).to.equal(0);
          
          done();
        }, 50);
    });
     

  });

  mocha.run();
});

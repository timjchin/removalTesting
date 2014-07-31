RemovalTesting
==============
Testing RenderNode.remove() in Famo.us.

To get started, initialize the Famo.us submodule:

```
git submodule update --init
serve 
```

Uses breadth first search to search down the Famo.us scene graph, removing all nodes and unregistering items from Entity. 

## Currently Tested
### BFS
#### One level
should find a single level surface 
should find a single level modifier 
shouldn't find a node not included in the tree

#### deep level
should find a nested surface.
should find a nested modifier.
should find a surface inside of a view
should find a surface inside of a view inside of a view 
should find a surface inside of a view inside of a view inside of a view..

### Removal
should remove a nested surface.
should unregister a nested surface from Entity.
should remove a portion of the render tree.
should remove a portion of the render tree inside of a view.
should remove a portion of the render tree inside of a view. Multiple surfaces.
should remove a portion of the render tree inside of a view. Multiple surfaces inside nested Views.
should unregister the portions of the render tree that were removed.

### Remove From Live Famo.us
should remove a surface.
should remove a portion of the render tree.
should remove a portion of the render tree.

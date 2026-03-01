export const updateLabel = (model, textDiv, sceneDiv, camera, textPosition) => {
    if (model) {
      textPosition.setFromMatrixPosition(model.matrixWorld);
      textPosition.project(camera);
  
      const halfWidth = sceneDiv.clientWidth / 2;
      const halfHeight = sceneDiv.clientHeight / 2;
      textPosition.x = (textPosition.x * halfWidth) + halfWidth;
      textPosition.y = - (textPosition.y * halfHeight) + halfHeight;
  
      const labelWidth = textDiv.offsetWidth;
      const labelHeight = textDiv.offsetHeight;
  
  
      // Check if the label is within the viewport
      const isInViewport = (
        textPosition.x >= -labelWidth &&
        textPosition.x <= sceneDiv.clientWidth &&
        textPosition.y >= -labelHeight &&
        textPosition.y <= sceneDiv.clientHeight
      );
  
      if (isInViewport) {
        textDiv.style.display = 'block';
        textDiv.style.top = `${Math.max(0, Math.min(textPosition.y, sceneDiv.clientHeight - labelHeight))}px`;
        textDiv.style.left = `${Math.max(0, Math.min(textPosition.x, sceneDiv.clientWidth - labelWidth))}px`;
      } else {
        textDiv.style.display = 'none';
      }
    }
  }
  
  
  export const updateIcon = (model, iconDiv, sceneDiv, camera, iconPosition) => {
    if (model) {
      // Get the position of the object in world space
      iconPosition.setFromMatrixPosition(model.matrixWorld);
      
      // Project this position to 2D screen space
      iconPosition.project(camera);
  
      const halfWidth = sceneDiv.clientWidth / 2;
      const halfHeight = sceneDiv.clientHeight / 2;
      iconPosition.x = (iconPosition.x * halfWidth) + halfWidth;
      iconPosition.y = - (iconPosition.y * halfHeight) + halfHeight;
  
      // Calculate the icon's position relative to its dimensions
      const iconWidth = iconDiv.offsetWidth;
      const iconHeight = iconDiv.offsetHeight;
      
      // Center the icon directly on top of the object
      const iconX = iconPosition.x - (iconWidth / 2);
      const iconY = iconPosition.y - (iconHeight / 2);
  
      // Set the icon's position
      iconDiv.style.left = `${iconX}px`;
      iconDiv.style.top = `${iconY}px`;
  
      // Check if the icon is within the viewport
      const isInViewport = (
        iconX >= 0 &&
        iconX <= sceneDiv.clientWidth - iconWidth &&
        iconY >= 0 &&
        iconY <= sceneDiv.clientHeight - iconHeight
      );
  
      // Toggle visibility based on whether the icon is in the viewport
      iconDiv.style.display = isInViewport ? 'block' : 'none';
    }
  };

  // Add label function, to add new bodies
export const addLabel = (name, data, celestials, setLabeledBodies) =>{
    const body = data.find(item => item.full_name === name);
    celestials[name] = body;
  
    setLabeledBodies(prevBodies => ({
      ...prevBodies, [name]: "#d73ce8"     
    }));
    
  }
  
  
  // Remove label function to remove newly added bodies
  export const removeLabel = (name, celestials, setLabeledBodies) => {
      delete celestials[name];
      setLabeledBodies(prevBodies => {
        const updatedBodies = { ...prevBodies };
        delete updatedBodies[name];              
        return updatedBodies;                    
      });
  }
module.exports = ({ name }, { exists, template, addToRoot }) => {
  if (!/^[A-Z][A-z0-9]*$/.test(name)) {
    throw new Error(`Invalid name "${name}"`);
  }
  const basePath = 'src/application/controllers';
  const filename = `${name}Controller.js`;
  const destination = `${basePath}/${filename}`;
  if (exists(destination)) {
    throw new Error(`Controller "${filename}" already exists`);
  }

  template('api:Controller.js', destination, { name, nameLower: name.toLowerCase() });
  addToRoot('Controller', name, './application/controllers');

  console.log(`Controller created at "${destination}"`);
};

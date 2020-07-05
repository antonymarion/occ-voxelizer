
function saveNodeOCCJS(voxelData) {
    let flagIsEnclosed, counter, counter2, numberOfVoxels, bitfield, hor, ver, dep, red, green, blue, id, procent,
        procentPrev, lookupData, obj, myNodes;
    numberOfVoxels = getNumberOfVoxels(voxelData);
    lookupData = [];
    myNodes = {};
    procentPrev = -1;
    counter = 0;
    counter2 = 0;

    const geometriesDocument = new GeometriesDocument({name: "conversion", description: "Description"});
    const object = geometriesDocument.geometryEditor;
    object.parametersEditor.addParameter({
        name: "voxSize",
        displayName: "voxSize",
        id: "voxSize",
        defaultValue: 1,
        units: "cm",
        description: "taille du cube avec normalisation"
    });

    for (ver = 0; ver <= voxelData.height; ver += 1) {
        procent = ver * (100 / (voxelData.height - 1)) >> 0;
        if (procent !== procentPrev) {
            procentPrev = procent;
            showProgress(Math.min(procent / 100, 1));
        }
        for (dep = 0; dep <= voxelData.depth; dep += 1) {
            for (hor = 0; hor <= voxelData.width; hor += 1) {
                id = (dep << 20 | ver << 10 | hor).toString();
                if (voxelData.dictionary.hasOwnProperty(id)) {
                    obj = voxelData.dictionary[id];
                    bitfield = obj.bitfield;
                    flagIsEnclosed = (bitfield & BITFIELD_ENCLOSED_VOXELS) === BITFIELD_ENCLOSED_VOXELS ? true : false;
                    if (voxelData.voxelSize < 1 || voxelData.voxelSize >= 1 && flagIsEnclosed === false) {

                        /* définition du node n°" + counter + "*/
                        myNodes[counter] = object.addBox();
                        myNodes[counter].name = "vox" + counter;
                        myNodes[counter].point1.set(0, 0, 0);
                        myNodes[counter].point2.set("$voxSize*" + voxelData.voxelSize, "$voxSize*" + voxelData.voxelSize, "$voxSize*" + voxelData.voxelSize);
                        myNodes[counter].innerRotation.center.set(0, 0, 0);
                        myNodes[counter].innerRotation.axis.set(0, 0, 0);
                        myNodes[counter].innerRotation.angle.set(0);
                        myNodes[counter].innerTranslation.vector.set("$voxSize*" + hor, "$voxSize*" + ver, "$voxSize*" + dep);
                        myNodes[counter].isVisible = false;

                        counter += 1;
                    }
                }
            }
        }
    }

    function getStr(a) {
        return "" + a;
    }

    getFuseStr = function (counter2, counter, isVisible = false) {
        let str = "";
        if (counter === counter2) {
            myNodes[getStr(counter) + "_0"] = myNodes[getStr(counter)].clone();
        } else {
            myNodes[getStr(counter) + "_0"] = object.addFuseOperation();
            myNodes[getStr(counter) + "_0"].name = "fuse" + counter;
            myNodes[getStr(counter) + "_0"].rightArg.set(myNodes[getStr(counter)]);
            myNodes[getStr(counter) + "_0"].leftArg.set(myNodes[getStr(counter - 1) + "_0"]);
            myNodes[getStr(counter) + "_0"].isVisible = isVisible;
        }
        return str;
    };

    let visibleNodeIdx = counter;
    counter = 0;
    for (let i = 0; i < visibleNodeIdx; i += 1) {

        let fuseStr = (counter < visibleNodeIdx - 1) ?
            getFuseStr(counter2, counter) :
            getFuseStr(counter2, counter, true);
        lookupData.push(fuseStr);
        counter += 1;
        if (counter % 2 == 0 && counter !== 0) {
            counter2 += 1;
        }

    }

    lookupData.push(geometriesDocument.convertToExportedString());

    showProgress(1);
    postMessage({
        event: "save",
        data: lookupData.join(""),
        type: "javascript"
    });
    lookupData = null;
}
